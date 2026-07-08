# Game Registry

This document catalogs the core gameplay mechanics, entity behaviors, and logic parameters that govern the game. Kept up to date by the `/imprint` skill.

### Tournament Mechanics
File: `src/game/TournamentManager.ts`
Last updated: 2026-07-07

| Property         | Value           |
| ---------------- | --------------- |
| Table Rebalance  | When `max - min >= 2` players difference |
| Elimination Rule | Eliminated bots mapped to `undefined` to leave "Empty" seat |
| Bot History      | Reset to 0 hands when joining hero's table if no immediate history |

**Pattern notes:**
Tournaments do not shrink the visual table size. Seats are kept statically positioned and rendered as Empty. Table balancing forces a full recreation of the tables to distribute players evenly. Stats for opponent bots are effectively "Hero vs Villain" — they reset to 0 hands when first met.

### Cash Game Mechanics
File: `src/game/PokerGame.ts`, `src/pages/GamePage.tsx`
Last updated: 2026-07-07

| Property         | Value           |
| ---------------- | --------------- |
| Bot AutoTop      | Checkbox enabled by default in cash games |
| Top Up Value     | Refills up to `INITIAL_CHIPS` (200) |
| Top Up Timing    | Evaluated between hands before `startNewHand()` |

**Pattern notes:**
Bots can automatically top up their stacks when out of a hand. Buy-in logic calculates the precise difference (`targetAmount - currentChips`) to maintain accurate `totalBuyIn` session PnL tracking.

### UI Checkbox Pattern
File: `src/pages/GamePage.tsx`
Last updated: 2026-07-07

| Property         | Value           |
| ---------------- | --------------- |
| Base Style       | `w-4 h-4 rounded bg-gray-800 border-gray-600` |

### UI Stat Patterns
File: `src/components/Seat.tsx`
Last updated: 2026-07-07

| Property         | Value           |
| ---------------- | --------------- |
| Final Stat Row   | `M-Ratio` instead of `Session Winnings` |
| M-Ratio Formula  | `Stack / (SB + BB)` |
| Color Coding     | `>= 15` Green, `<= 5` Red, else Yellow |

**Pattern notes:**
The bottom row of player statistics always prioritizes tournament-relevant stack depth (M-Ratio) rather than session cash game winnings, applying to all game modes for consistency.

### Advanced Analytics & Profiling
File: `src/game/OpponentProfiler.ts`, `src/pages/StatisticsPage.tsx`
Last updated: 2026-07-08

| Property         | Value           |
| ---------------- | --------------- |
| Instantiation    | `OpponentProfiler.initializeStats()` |
| C-Bet Tracking   | Flop, Turn, River evaluated for pre-flop aggressor |
| Showdown Stats   | WTSD%, W$SD, W$WSF tracked upon hand completion |
| Positional Stats | VPIP, PFR, ATS isolated per seat (UTG, BTN, etc.) |

**Pattern notes:**
All bots and human players must have their stats instantiated via `OpponentProfiler.initializeStats()` to ensure complex substructures (like `positionalStats`) exist. The system tracks raw counts during the hand and recalculates percentages dynamically. The main `StatisticsPage` defaults to aggregating these across a player's lifetime as a Global Leakfinder rather than focusing purely on a single session's variance.
