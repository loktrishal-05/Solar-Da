# Project rules

This repo extends Solarda into an agentic smart-agriculture system for the Agentic AI Hackathon 2026.
The full spec is docs/BLUEPRINT.md. Follow it phase by phase.

## Rules
1. Never start a phase until the previous phase gate passes.
2. One git branch per phase, for example phase-0-foundations. Small commits.
3. Never commit secrets, datasets, model weights or node_modules. Respect .gitignore.
4. Existing code is unaudited. Before changing a feature, record in docs/AUDIT.md whether it is real, UI-only or broken.
5. Do not delete existing features. Wrap or extend them.
6. All sensor data comes from the replay layer and is tagged with its source. Never present replayed data as live.
7. The LLM only proposes. The TypeScript engine safety check decides.
8. Every task is done only when it has code, a test, and a docs update.
9. When something is unclear or the blueprint conflicts with the code, stop and ask.

## Continuing work
When the user says "continue", read `docs/NEXT.md` (current state, how to start the stack, ordered task list) and resume from its first open item.
