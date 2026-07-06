---
name: test
description: Writes, executes, and fixes automated tests for the game's codebase to ensure mechanics work reliably and prevent regressions.
---

Even games need tests. This skill ensures that game logic, math utilities, state machines, and core mechanics are verified automatically.

Run this skill when a new game feature is completed, when refactoring code (e.g., after `/optimize`), or when requested to write tests for existing logic.

---

## Step 1 — Analyze the Target

Understand what you are testing:
- Read the target entity, manager, or utility function.
- Identify the inputs (dt, input state, collisions).
- Identify the expected outputs (new position, state change, score increase).
- Identify edge cases (negative delta time, bounds limits, conflicting inputs).

---

## Step 2 — Write the Tests

Write robust tests using the project's testing framework:
- **Unit Tests**: For isolated functions, math utilities (e.g., AABB collision checks, vectors), or simple pure logic.
- **State Tests**: For state machines (e.g., ensuring a player cannot jump if they are already falling).
- **Test Descriptions**: Write clear test blocks (e.g., `it('should transition to FALLING state when velocity Y > 0')`).

---

## Step 3 — Execute and Fix

Do not just write tests and assume they pass.
- Run the tests locally.
- If a test fails, analyze the error:
  - If the game logic is wrong, fix the logic.
  - If the test is wrong (e.g., bad mock, wrong assertion), fix the test.
- Repeat until green.

---

## Step 4 — Report

Provide a summary of the test coverage added. Do not dump the entire test file contents into the chat unless asked; just summarize what was verified and confirm that the suite passes.
