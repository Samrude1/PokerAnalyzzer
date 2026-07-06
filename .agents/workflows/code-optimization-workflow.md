# Code Optimization & Refactoring Workflow

Use this workflow when the goal is not to add new features, but to improve the quality, performance, and readability of the existing codebase. This workflow strictly targets "spaghetti code", enforces modern JavaScript standards, and ensures maximum performance for the game loop.

1. **Analyze** (`/optimize`):
   - Review the target codebase or specific files.
   - Identify performance bottlenecks (e.g., in `update()` or `draw()` loops), memory leaks, excessive object creation, and unnecessarily complex logic.
   - Check compliance against `.agents/context/code-standards.md` and `.agents/context/architecture.md`.

2. **Architect** (`/architect`):
   - Propose an optimization plan (`implementation_plan.md`). 
   - Document precisely what will be refactored, the expected performance/readability gains, and how modern standards will be applied.
   - Wait for human approval before modifying any code.

3. **Refactor**:
   - Execute the cleanup based strictly on the approved plan.
   - Enforce modern Vanilla JS practices: use ES6+ classes, separate logic and rendering, and avoid garbage collection pauses.
   - Ensure variables, functions, and classes are named clearly and logically.

4. **Verify** (`/review`):
   - Verify that the game's core functionality remains 100% identical to before the refactoring (no regressions).
   - Confirm that the code is now condensed, clean, and optimized.
   - Output the summary of changes and improvements to `walkthrough.md`.

5. **Remember** (`/remember save`):
   - Save the session state so the context is not lost and the AI remembers the newly optimized structure in future sessions.
