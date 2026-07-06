---
name: optimize
description: Analyzes and refactors game code to follow best practices, improve game loop performance, and clean up spaghetti logic.
---

In game development, code gets bloated fast, and poor logic directly causes frame drops, garbage collection pauses, and unmaintainable state. This skill is used to review, clean, and condense game code into a highly performant and professional standard.

Run this skill when the codebase feels messy, when performance drops, or as part of the Code Optimization Workflow.

---

## Step 1 — Analyze the Current State

Before making any changes, understand what you are looking at:

- Identify the file, entity, or logic flow that needs optimization.
- Look for:
  - **Spaghetti logic**: Deeply nested `if/else` statements in the `update()` loop, tangled state machines.
  - **Performance bottlenecks**: Heavy calculations inside the game loop that could be pre-calculated.
  - **Garbage Collection (GC) pauses**: Creating new objects (e.g., `new Vector2()`, new arrays) inside the `update()` or `draw()` loops. (Look for object pooling opportunities).
  - **Dead code**: Variables, assets, or functions that are no longer used.

---

## Step 2 — Formulate a Plan

Do NOT start deleting or rewriting code blindly. 

- Create an `implementation_plan.md` artifact detailing your findings.
- Propose structural changes:
  - "Extract this massive Player update function into smaller state-based handlers (idle, run, jump)."
  - "Implement Object Pooling for these bullets to prevent GC spikes."
  - "Cache this expensive query instead of running it every frame."
- Present the plan to the developer for approval.

---

## Step 3 — Optimize & Condense

Once approved, perform the refactoring:
- **Extract and Modularize**: Break large components/functions into smaller, single-responsibility pieces.
- **Performant Patterns**: Use flat arrays, object pooling, and bitwise operations where appropriate. Avoid `new` keywords in loops.
- **Clean Up**: Remove unused imports, variables, and dead code.

---

## Step 4 — Verify

Refactoring must not change the expected behavior of the game.
- Ensure the optimized code still fulfills all original mechanics.
- Run `/review` if needed to double-check against project standards.
- If a new architectural pattern was established (like a new Entity Component structure), recommend running `/imprint` so it becomes the new standard.
