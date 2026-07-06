# Code Standards

## Principles

1. **Simplicity over Complexity**: Do not over-engineer with excessive patterns. Simple, well-typed functions and React hooks are often enough.
2. **Performance First**: The UI should only render when necessary. Optimize React re-renders using `React.memo`, `useMemo`, and `useCallback`.
3. **Separation of Concerns**: Keep the game engine (`PokerGame.ts`, etc.) completely isolated from React UI components. Game logic should be pure TypeScript without DOM or React dependencies.

## Rules

- **Immutability**: Game state provided to React should be treated as immutable to ensure React detects changes correctly.
- **Strict Typing**: Use TypeScript's strict mode. Avoid `any` types. Define clear interfaces for all game entities and state objects.
- **Pure Functions**: Where possible, make game logic functions pure (no side effects) to make testing and debugging easier.
- **File Structure**: Each major Game Entity (e.g., `Deck`, `BotLogic`) or UI Component (e.g., `PokerTable`, `Card`) should have its own file to keep things organized.
