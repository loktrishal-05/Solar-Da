"""LLM access through one switch. Off by default; the rules-only path is always the fallback.

SOLARDA_LLM=1 plus a provider key (GOOGLE_API_KEY for the default Gemini model) turns it on.
SOLARDA_LLM_MODEL picks the model, e.g. "google_genai:gemini-2.5-flash" or "anthropic:claude-sonnet-5-5".
"""
import os
from typing import Literal

from pydantic import BaseModel, Field

DEFAULT_MODEL = "google_genai:gemini-2.5-flash"
_KEY_FOR = {"google_genai": "GOOGLE_API_KEY", "anthropic": "ANTHROPIC_API_KEY", "openai": "OPENAI_API_KEY"}


class Issue(BaseModel):
    zone: str
    topic: Literal["climate", "fertigation", "irrigation", "disease", "sensor"]
    severity: Literal["low", "medium", "high"]
    summary: str = Field(description="One sentence, cites the reading ids it relies on")


class Situation(BaseModel):
    issues: list[Issue] = Field(description="Ranked, most severe first")
    note: str = Field(description="Short plain-language summary for the farmer")


def enabled() -> bool:
    if os.environ.get("SOLARDA_LLM") != "1":
        return False
    provider = os.environ.get("SOLARDA_LLM_MODEL", DEFAULT_MODEL).split(":")[0]
    return bool(os.environ.get(_KEY_FOR.get(provider, ""), ""))


def structured(schema: type[BaseModel]):
    from langchain.chat_models import init_chat_model

    model = init_chat_model(os.environ.get("SOLARDA_LLM_MODEL", DEFAULT_MODEL), temperature=0)
    return model.with_structured_output(schema)
