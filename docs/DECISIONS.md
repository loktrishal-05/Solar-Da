# Decisions

## D1: Theme (2026-10-23)
Conflict: `docs/HANDOFF.md` says dark theme is the consensus; the running app (`App.tsx` -> `Light*` components) and the live site are light.
Decision (provisional, Phase 0): **light is the shipped theme**, because it is what renders and what the live site shows. Dark* components remain in the tree unwired. Owner can reverse this; change `App.tsx` imports.
