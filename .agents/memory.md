# Memory — Multi-Table Tournament Engine & Dynamic 9-Max Tables

Last updated: 2026-07-07

## What was built

- **Multi-Table Tournament Engine**: Created `src/game/TournamentManager.ts` to manage 50-player tournaments. It handles table balancing, blind level progression, payouts, and simulating background hands automatically.
- **Dynamic 9-Max Support**: Updated `src/game/PokerGame.ts` and UI components (`PokerTable.tsx`, `Seat.tsx`) to support dynamic player counts from 6-max up to 9-max.
- **Tournament Mode Integration**: Added mode selection to `HomePage.tsx` and updated `GamePage.tsx` to route game progression through the `TournamentManager`.
- **Bot Logic SBR Awareness**: Updated `BotLogic.ts` to include Stack-to-Blind Ratio (SBR) logic. Bots with ≤ 15BB automatically revert to a push/fold strategy pre-flop.
- **UI Enhancements**:
  - Filtered eliminated players from `PokerTable.tsx` so they immediately disappear from the UI.
  - Re-positioned the Pot indicator to avoid overlapping player stats.
  - Increased HUD stat font sizes and fixed the WTSD calculation in `Seat.tsx` to show a proper percentage (based on flops seen via VPIP).
  - Added a staggered CSS animation delay for all-in board runouts (Flop, pause, Turn, pause, River).

## Decisions made

- **Synchronous Background Engine**: Background tournament tables are simulated instantly and synchronously in `TournamentManager` when the human plays a hand, keeping the engine decoupled from UI-specific timeout delays.
- **Bot Pool Generation**: `TournamentManager` now respects the selected table difficulty for the entire tournament. Selecting "Pro" generates an entire field of Pro bots; selecting "Mixed" generates a randomized pool.
- **Seat Rotation Strategy**: To keep the hero at the bottom of the screen (`Seat 0`), `PokerTable.tsx` creates a new array using `slice` to rotate the players circularly. This preserves the absolute positioning order without breaking dealer button assignments.

## Problems solved

- **Action Skipping Bug**: Fixed a severe UI bug in `PokerTable.tsx` where using `splice` instead of `slice` broke the circular array indexing, causing the visual action order to jump non-circularly around the table and creating a false "skipped turn" impression.
- **Table Crowding**: Added explicit coordinate maps for 7-max, 8-max, and 9-max configurations in `Seat.tsx` to distribute players evenly and prevent clumping at the top-left of the table.

## Current state

- The MTT feature is fully operational. A human player can play a 50-player tournament with automatic blind increases, table balancing, and background bot simulation.
- UI scaling and positioning are stable for all table sizes.
- The project type-checks perfectly and is stable.

## Next session starts with

- Reviewing any gameplay quirks in the new tournament mode, or picking up the next major feature/mechanic off the backlog (e.g., sound effects, session history tracking, or backend integration).

## Open questions

- Should the background simulation speed or tournament blind structure (currently 10 hands per level) be configurable by the user?
