# Level Design Workflow

Use this workflow when creating new levels, configuring tilemaps, or placing entities within a scene.

1. **Architect** (`/architect`):
   - Plan the level layout, tile sizes, and entity spawn points.
   - Create the `implementation_plan.md` artifact for approval.
2. **Develop**:
   - Create or modify the level data structure (e.g., 2D arrays, JSON files, or text maps).
   - Ensure the level parser correctly loads the data and instantiates the required entities.
3. **Review** (`/review`):
   - Ensure the level loads correctly without crashing and performs well.
4. **Remember** (`/remember save`):
   - Save memory state.
