"""LLM access through one switch. Off by default for the farm-shift graph; the rules-only path is always the fallback.

SOLARDA_LLM=1 plus a provider key turns the graph's LLM nodes on. GEMINI_API_KEY (or GOOGLE_API_KEY) is used for Gemini.
SOLARDA_LLM_MODEL picks the model, e.g. "google_genai:gemini-3.5-flash" or "anthropic:claude-sonnet-5-5".
The chat assistant (app/chat.py) uses Gemini whenever a key is present (SOLARDA_CHAT=0 turns it off).
"""
import os
from typing import Literal

from pydantic import BaseModel, Field

DEFAULT_MODEL = "google_genai:gemini-3.5-flash"
CHAT_MODEL = os.environ.get("SOLARDA_CHAT_MODEL", "gemini-3.5-flash-lite")  # free tier: flash allows only 20 requests/day
CHAT_FALLBACK = os.environ.get("SOLARDA_CHAT_FALLBACK", "gemini-3.1-flash-lite")
_KEY_FOR = {"google_genai": "GOOGLE_API_KEY", "anthropic": "ANTHROPIC_API_KEY", "openai": "OPENAI_API_KEY"}


def google_key() -> str:
    return os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY") or ""


class Issue(BaseModel):
    zone: str
    topic: Literal["climate", "fertigation", "irrigation", "disease", "sensor", "forecast"]
    severity: Literal["low", "medium", "high"]
    summary: str = Field(description="One sentence, cites the reading ids it relies on")


class Situation(BaseModel):
    issues: list[Issue] = Field(description="Ranked, most severe first")
    note: str = Field(description="Short plain-language summary for the farmer")


def _key_for(provider: str) -> str:
    return google_key() if provider == "google_genai" else os.environ.get(_KEY_FOR.get(provider, ""), "")


def enabled() -> bool:
    if os.environ.get("SOLARDA_LLM") != "1":
        return False
    return bool(_key_for(os.environ.get("SOLARDA_LLM_MODEL", DEFAULT_MODEL).split(":")[0]))


def _init(spec: str, **kw):
    from langchain.chat_models import init_chat_model

    provider = spec.split(":")[0]
    if provider == "google_genai":
        kw = {"google_api_key": google_key(), "thinking_budget": 0, **kw}
    return init_chat_model(spec, **kw)


def structured(schema: type[BaseModel]):
    return _init(os.environ.get("SOLARDA_LLM_MODEL", DEFAULT_MODEL), temperature=0).with_structured_output(schema)


def text_model():
    return _init(os.environ.get("SOLARDA_LLM_MODEL", DEFAULT_MODEL), temperature=0)


def chat_enabled() -> bool:
    return os.environ.get("SOLARDA_CHAT", "1") != "0" and bool(google_key())


def chat_model(fallback: bool = False, timeout: float = 25):
    """Gemini chat model with thinking off (first token ~1 s). Fallback: the lite model."""
    from langchain_google_genai import ChatGoogleGenerativeAI

    name = CHAT_FALLBACK if fallback else CHAT_MODEL
    kw = {} if "lite" in name else {"thinking_budget": 0}
    return ChatGoogleGenerativeAI(model=name, google_api_key=google_key(), temperature=0.4, timeout=timeout,
                                  max_retries=1, **kw)
