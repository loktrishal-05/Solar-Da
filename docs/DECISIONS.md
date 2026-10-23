# Decisions

## D1: Theme (2026-10-23)
Conflict: `docs/HANDOFF.md` says dark theme is the consensus; the running app (`App.tsx` -> `Light*` components) and the live site are light.
Decision (provisional, Phase 0): **light is the shipped theme**, because it is what renders and what the live site shows. Dark* components remain in the tree unwired. Owner can reverse this; change `App.tsx` imports.

## D2: Python interpreters and AquaCrop version (2026-10-23)
Test install on Windows 11:
- AquaCrop-OSPy **3.0.10 on CPython 3.10.11: fails on import**. It AOT-compiles with numba on first use and needs an MSVC compiler (`Cannot find suitable msvc`).
- AquaCrop-OSPy **3.1.0 on CPython 3.11.9: imports and runs** the bundled Tunis wheat example (`services/twin/tests/test_aquacrop_smoke.py`).
Decision: both `services/agents` and `services/twin` use CPython 3.11.9 in **separate venvs**; twin pinned to `aquacrop==3.1.0`. Exact pins: `services/*/requirements.lock`. This differs from the blueprint's 3.0.10 / 3.7-3.10 assumption.

## D3: Module owners
Team not confirmed yet. Fill in before Phase 1.

| Module | Owner |
|---|---|
| web (Agent Console, approvals, benchmark page) | TBD |
| api + engine (safety check, envelope rules) | TBD |
| services/agents (replay, LangGraph) | TBD |
| services/twin + bench | TBD |
| services/vision | TBD |
| demo, evidence, slides | TBD |
