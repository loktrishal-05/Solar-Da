"""The agent runtime proves itself to the API with the shared key (env first, then data/runtime/.internal_key)."""
from app import api_client


def test_key_from_env(monkeypatch):
    monkeypatch.setenv("SOLARDA_INTERNAL_KEY", "from-env")
    assert api_client.internal_headers() == {"X-Solarda-Internal": "from-env"}


def test_key_from_runtime_file(monkeypatch, tmp_path):
    monkeypatch.delenv("SOLARDA_INTERNAL_KEY", raising=False)
    (tmp_path / ".internal_key").write_text("from-file\n")
    monkeypatch.setattr(api_client, "RUNTIME", tmp_path)
    assert api_client.internal_headers() == {"X-Solarda-Internal": "from-file"}


def test_no_key_sends_no_header(monkeypatch, tmp_path):
    monkeypatch.delenv("SOLARDA_INTERNAL_KEY", raising=False)
    monkeypatch.setattr(api_client, "RUNTIME", tmp_path)
    assert api_client.internal_headers() == {}
