# Memory — Leakfinder Dashboard & Advanced Profiling

Last updated: 2026-07-08

## What was built

- **Advanced Profiling Engine**: Expanded `PokerGame.ts`, `OpponentProfiler.ts`, and `ShowdownResolver.ts` to track granular metrics during hand progression: C-Bet (Flop/Turn/River), ATS (Attempt to Steal), Fold-to-Steal, and Showdown metrics (WTSD%, W$SD, W$WSF).
- **Hand Descriptions**: Added `heroHandDescription` tracking to showdowns so the UI can log the explicit textual strength of a hand (e.g., "Full House").
- **Leakfinder Dashboard**: Built a completely new "Global Leakfinder" UI on `StatisticsPage.tsx` utilizing `recharts`. It dynamically visualizes C-Bet tendencies, warns of leaks like "Calling Station" behavior using Showdown ratios, and includes a full Positional Matrix (VPIP/PFR/ATS per seat).
- **Session Navigation**: Overhauled the UX on the Statistics page so that the global Leakfinder is the default view. Added a "🌍 Global Leakfinder" button to explicitly return to the global view after reviewing a specific session.

## Decisions made

- **Standardized Initialization**: Replaced manual stat object assignments scattered across the codebase with a unified call to `OpponentProfiler.initializeStats()`. This guarantees all entities (Hero and Bots) always have complex sub-structures like `positionalStats` properly defined.
- **Default Dashboard State**: Disabled the automatic selection of the first session on the Statistics page to ensure the overarching analytical Leakfinder is the first thing a player sees upon entering.

## Problems solved

- **Runtime Crashes**: Solved `Cannot read properties of undefined (reading 'CO')` during steals by updating `TournamentManager.ts` and `GamePage.tsx` to instantiate bot and hero stats correctly using `initializeStats()`.
- **JSX Compilation Error**: Fixed a Vite hot-reload break caused by an unescaped `>` symbol in the JSX leakfinder text.
- **Duplicate UI Rendering**: Fixed a bug where the old "Lifetime Cash Game Stats" was unconditionally rendering on top of the selected session's Profit & Loss graph.

## Current state

- The game features a complete, Poker Tracker-style analytics suite.
- Positional, C-Bet, and Showdown data correctly accumulate during hands and are serialized to session JSON files for lifetime aggregation.
- The UI handles the rendering of both global analytics and granular single-session reviews cleanly.

## Next session starts with

- Fulfilling the pending user request: Making the **Tournament Final Table** visually distinct (e.g., changing the table texture to red) to give players a clear indication that they have reached the final phase.

## Open questions

- Are there any other specific stats or Leakfinder warnings the user wants to add to the dashboard?
