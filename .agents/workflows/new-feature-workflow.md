# New Game Feature Workflow

Use this workflow when adding a major new mechanic or system to the game (e.g., adding an inventory system, a new game mode, or a complex AI behavior). For simple entities (like a new enemy or item), use `game-entity-workflow.md`.

1. **Architect** (`/architect`):
   - Plan the feature. Check `architecture.md` and `code-standards.md` to ensure compliance (especially regarding performance and the game loop).
   - Create the `implementation_plan.md` artifact for approval.
2. **Develop**:
   - Write the code, strictly following the approved plan.
3. **Review** (`/review`):
   - Ensure the feature is fully built, respects performance constraints, and output the review to `walkthrough.md`.
4. **Remember** (`/remember save`):
   - Save memory so the context is not lost for future sessions.
