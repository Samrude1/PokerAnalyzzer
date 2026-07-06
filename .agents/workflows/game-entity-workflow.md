# Game Entity Workflow

Use this workflow when creating a new in-game object (e.g., a new enemy type, a projectile, a collectible item, or a moving platform).

1. **Architect** (`/architect`):
   - Plan the entity's properties (hitbox, speed, sprite size) according to `game-design-context.md`.
   - Decide how its `update(deltaTime)` and `draw(ctx)` methods will function.
2. **Develop**:
   - Build the entity class in its respective file.
   - Integrate it into the `EntityManager` or main Game Loop.
3. **Review** (`/review`):
   - Verify visually and technically against design standards and performance guidelines (e.g., object pooling if it spawns frequently).
4. **Imprint** (`/imprint`):
   - Add the new entity patterns (hitbox size, movement logic parameters, color/sprite references) to `game-registry.md` to maintain consistency for future entities of this type.
