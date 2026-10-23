"""TypeScript fixture -> JSON -> Pydantic -> JSON must match the original; invalid fixtures must be rejected."""
import json
from datetime import datetime
from pathlib import Path

import pytest
from pydantic import ValidationError

from app import models

FIXTURES = Path(__file__).resolve().parents[3] / "packages" / "contracts" / "fixtures"
valid = json.loads((FIXTURES / "valid.json").read_text(encoding="utf-8"))
invalid = json.loads((FIXTURES / "invalid.json").read_text(encoding="utf-8"))


def norm(v):
    """Compare timestamps as instants (Pydantic prints 'Z' without milliseconds)."""
    if isinstance(v, dict):
        return {k: norm(x) for k, x in v.items()}
    if isinstance(v, list):
        return [norm(x) for x in v]
    if isinstance(v, str) and v.endswith("Z") and "T" in v:
        return datetime.fromisoformat(v)
    return v


@pytest.mark.parametrize("name", valid)
def test_roundtrip(name):
    model = getattr(models, name).model_validate(valid[name])
    out = json.loads(model.model_dump_json(exclude_none=True))
    assert norm(out) == norm(valid[name])


@pytest.mark.parametrize("name", invalid)
def test_invalid_rejected(name):
    with pytest.raises(ValidationError):
        getattr(models, name).model_validate(invalid[name])
