# Memory — Codebase Optimization & Engine Refactoring

Last updated: 2026-07-07

## What was built

- **BotLogic Strategy Pattern**: Refactored the massive `BotLogic.ts` file. Created `BotStrategy.ts` interface, extracted utilities to `BotLogicUtils.ts`, and separated logic into `BeginnerStrategy`, `IntermediateStrategy`, `AdvancedStrategy`, and `ProStrategy`.
- **ShowdownResolver**: Extracted the complex showdown evaluation, side-pot, and stats tracking logic from `PokerGame.ts` into a dedicated `ShowdownResolver.ts` file, significantly reducing the size of the core game engine.
- **UI Performance Tweaks**: Wrapped state derivations (`activePlayers`, `rotatedPlayers`) in `useMemo` and the deal timing logic in `useCallback` inside `PokerTable.tsx` to prevent unnecessary recalculations on re-renders.

## Decisions made

- **In-File Strategy Pattern**: To avoid massive import breakage and over-engineering, all four difficulty strategies were implemented as separate classes within the single `BotLogic.ts` file. A simple factory switch determines which strategy to invoke.
- **Strict Separation**: Hand evaluation and stats generation at showdown are completely decoupled from the game loop state machine (`PokerGame.ts`), meaning future changes to payouts/stats won't break the betting logic.

## Problems solved

- Fixed strict TypeScript errors (e.g., unused variables in `BotLogic.ts`, `PokerGame.ts`, and `HandHistoryParser.ts`) that were identified during the build verification step.
- Removed massive "Spaghetti" code branching from `PokerGame.ts` and `BotLogic.ts`, complying with the architectural standards defined in `.agents/context/code-standards.md`.

## Current state

- The game behaves identically to the previous version but is structurally optimized.
- The project successfully compiles with `npm run build` and has zero type errors.

## Next session starts with

- Moving on to the next major mechanic on the backlog, such as integrating **sound effects** or a **session history tracking** dashboard.

## Open questions

- (From previous session) Should the background simulation speed or tournament blind structure (currently 10 hands per level) be configurable by the user?
