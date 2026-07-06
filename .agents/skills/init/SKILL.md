---
name: init
description: Bootstraps a new game project from the template by interviewing the user and automatically populating all context files (architecture, project-overview, game-asset-registry, etc.).
---

The `Agentic-games-template` is a generic game foundation. When a developer clones it to start a new game, this skill transforms the generic template into a specific, documented project foundation.

Run this skill ONLY when starting a brand new project, or when the user explicitly calls `/init` or `/bootstrap`.

---

## Step 1 — Gather Initial Requirements

Do not start writing files immediately. First, gather the requirements.
1. **Check for existing specs**: Always look for and read `docs/future-project-vision.md` or any initial prompt the user provides. This usually contains the "big picture" of the game.
2. **Interview if needed**: If a vision document exists, use it as your foundation. Only ask the user clarifying questions about details that are missing from the document. If no document exists, ask the user to describe:
   - What is the core game loop?
   - What is the genre and visual style (pixel art, 3D, vector)?
   - What are the main entities and mechanics?
   - Are there any specific architectural constraints (e.g., specific engine versions, physics library)?

Wait for the user's response (or confirmation that you have enough info) before proceeding.

---

## Step 2 — Plan the Context

Based on the user's answers, formulate a plan to update the `.agents/context/` files.
- `project-overview.md`: Replace all `[bracketed]` boilerplate with the actual game details, goals, and scope.
- `architecture.md`: Define the specific tech stack, rendering loop, state management, and physics approach suited for this game.
- `game-asset-registry.md`: Draft the initial necessary core assets (e.g., player sprite placeholder, basic level map).
- `ui-registry.md`: Define the primary design tokens (colors, fonts) for the game's HUD and menus.

---

## Step 3 — Populate the Files

Once the user approves the overall plan, aggressively overwrite the boilerplate in the `.agents/context/` folder with the new, specific game information. 
Use your file editing tools to remove the generic placeholders and insert the real game concept.

---

## Step 4 — Handoff

Once the context is populated, the game project is officially bootstrapped. 
Inform the user that the AI is now fully aware of the game's rules, mechanics, and architecture, and ask what feature/entity they would like to build first (often triggering `/architect`).
