# Game Consistency Registry

This file tracks the core game balance and configuration parameters for AI bots, tournaments, and other game mechanics.

### Bot Profiles (OpponentProfiler)

File: `src/game/OpponentProfiler.ts`
Last updated: 2026-07-07

| Property | Value |
| --- | --- |
| Sample Size Needed | 15 hands |
| Nit VPIP / PFR | < 18% / < 14% |
| Fish VPIP / PFR | > 30% / < 15% |
| TAG VPIP / PFR | 18-28% / 15-25% |
| LAG VPIP / PFR | > 28% / > 20% |

**Pattern notes:**
The bot classification system evaluates VPIP and PFR after a 15-hand minimum. Any changes to bot behavior or HUD stats should align with these percentage thresholds.

### Tournament Structure (TournamentManager)

File: `src/game/TournamentManager.ts`
Last updated: 2026-07-07

| Property | Value |
| --- | --- |
| Starting Stack | 1000 |
| Default Buy-In | 10 chips/dollars |
| Starting Players | 50 |
| ITM (In The Money) | Top 15% (Approx 7 players) |
| Payout Distribution | 1st: 30%, 2nd: 20%, 3rd: 15%, 4th: 10%, 5th-7th: 8.33% |

**Pattern notes:**
Tournaments are fixed at 50 players with a 10 buy-in. Payout calculations are strictly defined to reward the top 15% of the field. Any new tournament types must adhere to similar ITM percentage ranges.

### Data Entities (SavedSession & SavedHand)

File: `src/services/StorageService.ts`
Last updated: 2026-07-08

| Property | Value |
| --- | --- |
| Session Mode | 'cash' or 'tournament' |
| Hand PnL Trackers | `heroNetWon`, `heroShowdownWon`, `heroNonShowdownWon` |
| Local Storage Structure | `database/<username>/<mode>/sessions/<date>/sess_xxx.json` |

**Pattern notes:**
Any new game mechanics or action loops that modify the hero's stack MUST accurately separate the profit/loss into `heroShowdownWon` and `heroNonShowdownWon`. This ensures the Statistics Engine can accurately draw the Red Line (Non-Showdown) and Blue Line (Showdown) graphs without discrepancies.
