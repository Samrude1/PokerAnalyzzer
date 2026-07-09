# Memory — Advanced HUD Stats and Global Leak Finder Upgrade

Last updated: 2026-07-09

## What was built

- Expanded `PlayerStats` in `src/game/types.ts` and updated `src/game/OpponentProfiler.ts` to track advanced HUD metrics: `foldToCbetOpp`, `foldToCbetCount`, `foldToThreeBetOpp`, `foldToThreeBetCount`.
- Updated `server/services/AIAnalyzer.js` to process and aggregate these stats from session JSONs (W$WSF, Fold to Steal, Fold to 3-Bet, Fold to Flop C-Bet, Turn/River C-Bet %).
- The Global Leak Finder (`actionType === 'leakfinder'`) no longer sends raw hand histories to the LLM. It performs a pure, token-efficient, data-driven analysis using `GLOBAL STATS`.
- Updated `README.md` and `game-registry.md` to document the advanced HUD stats tracking architecture.

## Decisions made

- Deterministic pre-computation strategy validated: Raw hand analysis is pushed to the game engine and aggregated by `AIAnalyzer.js`. The AI is only fed the final cumulative statistical numbers for "Leak Finder", which saves massive token costs and eliminates hallucination.
- Implemented strict separation of concerns for HUD tracking: The game loop (`OpponentProfiler.ts`) increments raw counters per player, and the backend (`AIAnalyzer.js`) calculates the percentages across the global session files.

## Problems solved

- Global Leak Finder context was too heavy and occasionally bogged down the LLM with specific hands instead of global leaks. Fixed by supplying a pure data matrix instead of 40 individual hand logs.
- Added missing metrics (Fold to C-bet, W$WSF) that are critical for CTO-level/elite poker analysis.

## Current state

- The AI Coach (Session Review and Global Leak Finder) is functioning flawlessly. Session Review handles specific hands, while Leak Finder handles global stats.
- Advanced HUD tracking is successfully integrated into the game engine logic and correctly saved into `sessions/` JSON files.
- The project is in a highly polished, portfolio-ready state.

## Next session starts with

- Reviewing the possibility of adding "Dynamic AI Bots" that adapt to the player's VPIP/PFR, or implementing "Scenario Training" drills (e.g. 3-Bet defense drill).
- Potential UI improvements to visualize the `GLOBAL STATS` on the frontend using Recharts or Radar charts.

## Open questions

- Should we integrate a backend API to import PokerStars Hand Histories (`.txt`) directly into the local `database/` format so the AI can analyze thousands of real-world hands?
