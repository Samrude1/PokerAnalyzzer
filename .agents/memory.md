# Memory — React UI & Engine Optimizations

Last updated: 2026-07-06

## What was built

- Refactored `src/components/Seat.tsx` to use `React.memo` and `useMemo` for inline stat calculations, preventing massive re-rendering loops during gameplay.
- Refactored `src/components/Card.tsx` to use `React.memo`.
- Simplified game engine logic in `src/game/BotLogic.ts` by replacing massive `switch` statements with a Strategy Pattern.
- Optimized `src/game/PokerGame.ts` `startNewHand` method to use a single `getNextActive` loop for finding positions (Dealer, SB, BB, UTG).
- Fixed legacy scoring thresholds in `src/game/BoardAnalyzer.ts` so that all 30 Vitest tests pass.

## Decisions made

- **Architecture Rules Resolved**: The `.agents/AGENTS.md` rules and `.agents/context/architecture.md` have been updated to officially support the existing **React and DOM** architecture for the Poker Trainer project. The pure TypeScript game engine runs independently of the React rendering layer. We are *not* using Canvas.

## Problems solved

- Fixed a TypeScript syntax error (`error TS1005: ')' expected`) in `Card.tsx` caused by a missing closing brace on `React.memo`.
- Fixed a module syntax error in `Card.tsx` by moving a misplaced `React` import to the top of the file.

## Current state

- The project is fully functional and optimized.
- All 30 unit tests are passing (`vitest --run`).
- The client-side persistence via LocalStorage is working as intended.

## Next session starts with

- Ready to start building new features or mechanics on top of the newly optimized game engine.

## Open questions

- None at the moment.
