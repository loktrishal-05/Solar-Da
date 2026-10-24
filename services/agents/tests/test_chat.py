"""Chat assistant safety tests. A fake Gemini model makes them deterministic and runnable without a key."""
import time

import pytest

from app import chat, llm


class FakeChunk:
    def __init__(self, text="", tool_calls=None):
        self.text, self.tool_calls = text, tool_calls or []

    def __add__(self, other):
        return FakeChunk(self.text + other.text, self.tool_calls + other.tool_calls)


class FakeModel:
    def __init__(self, replies):
        self.replies, self.calls = list(replies), 0

    def bind_tools(self, _):
        return self

    def stream(self, convo):
        self.calls += 1
        reply = self.replies.pop(0)
        if isinstance(reply, dict):  # a tool call round
            yield FakeChunk(tool_calls=[reply])
            return
        for word in reply.split(" "):
            yield FakeChunk(word + " ")


@pytest.fixture
def fake(monkeypatch):
    def install(replies, risk="general", delay=0.0, language="en"):
        model = FakeModel(replies)
        monkeypatch.setattr(llm, "chat_enabled", lambda: True)
        monkeypatch.setattr(llm, "chat_model", lambda fallback=False, timeout=25: model)

        def classify(text):
            time.sleep(delay)
            return {"risk": risk, "language": language, "romanised": False, "english": text, "by": "fake"}
        monkeypatch.setattr(chat, "classify", classify)
        monkeypatch.setattr(chat, "_audit", lambda *a, **k: None)
        return model
    return install


def events(q, **kw):
    return list(chat.stream([{"role": "user", "content": q}], **kw))


def test_nothing_reaches_the_farmer_before_the_risk_check(fake):
    # The classifier is slow and says "dose": the drafted answer (with a dose!) must never be streamed.
    fake(["Spray 5 ml per litre of copper every week"], risk="dose", delay=0.3)
    ev = events("what about my tomato leaves")  # no regex hit, so the LLM classifier decides
    types = [e["type"] for e in ev]
    assert types.index("meta") < types.index("token")
    text = "".join(e["text"] for e in ev if e["type"] == "token")
    assert "5 ml" not in text and ev[-1]["escalated"] and ev[-1]["model"] == "advisor-graph"


def test_output_guard_retracts_a_dose_in_a_general_answer(fake):
    fake(["Mix 20 g per litre and spray"], risk="general")
    ev = events("tell me about blight")
    assert any(e["type"] == "retract" for e in ev) and ev[-1]["escalated"]
    assert "20 g" not in ev[-1]["answer"]


def test_tools_are_read_only_and_cited(fake):
    model = fake([{"name": "search_knowledge", "args": {"query": "drip irrigation"}, "id": "c1"},
                  "Drip puts water at the roots [Drip irrigation]."])
    ev = events("what is drip irrigation")
    assert [e["name"] for e in ev if e["type"] == "tool"] == ["search_knowledge"]
    assert ev[-1]["citations"] and model.calls == 2 and not ev[-1]["escalated"]


def test_regex_dose_question_never_calls_the_chat_model(fake):
    model = fake(["should not be used"], risk="dose")
    ev = events("How many ml of mancozeb per litre?")
    assert model.calls == 0 and ev[-1]["escalated"]


def test_fixed_escalation_text_per_language():
    for lang in ("en", "ta", "hi", "te", "kn", "ml"):
        assert "KVK" in chat.escalation_text(lang, False)
    assert chat.escalation_text("ta", True).startswith("Marunthu")


def test_phone_numbers_are_scrubbed_before_the_model(fake, monkeypatch):
    seen = {}
    fake(["ok"])
    real = chat.classify

    def spy(text):
        seen["text"] = text
        return real(text)
    monkeypatch.setattr(chat, "classify", spy)
    events("call me on 9876543210 about my farm")
    assert "9876543210" not in seen["text"]


def test_language_detection_by_script():
    assert chat.detect_language("தக்காளி") == "ta" and chat.detect_language("टमाटर") == "hi"
    assert chat.detect_language("టమాటా") == "te" and chat.detect_language("ಟೊಮೆಟೊ") == "kn"
    assert chat.detect_language("തക്കാളി") == "ml" and chat.detect_language("tomato") is None
