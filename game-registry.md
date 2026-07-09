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

### AI Coach (Local RAG)

File: `server/services/RAGPipeline.js` & `server/services/VectorStore.js`
Last updated: 2026-07-09

| Property | Value |
| --- | --- |
| Chat Model | `qwen3.5:4b` |
| Embed Model | `nomic-embed-text` |
| Vector DB | Custom JSON-backed Cosine Similarity |
| RAG Context Limit | Top 2 hands per query |
| Context Filtering | Specific `contextSessionId` or Global |
| Chat Streaming | Server-Sent Events (SSE) via Express |

**Pattern notes:**
The AI Coach is built to be 100% local for privacy and offline usage via Ollama. Because it runs on consumer hardware (e.g. 4GB VRAM), we strictly limit RAG context to TopK=2 and use lightweight 4B parameter models. The vector database is intentionally kept as a simple JSON file rather than importing heavy dependencies. All new AI features must adhere to these lightweight constraints, provide context filtering to avoid massive context windows, and always stream text via SSE to prevent UX freezes.

### HUD Tracking Metrics

File: src/game/OpponentProfiler.ts
Last updated: 2026-07-09

| Property | Description |
| --- | --- |
| foldToSteal | Folds in SB/BB vs Late Position open. |
| foldToThreeBet | Folds vs re-raise preflop after VPIP/PFR. |
| foldToCbet | Folds on flop vs preflop aggressor bet. |
| cbetTurn / cbetRiver | Multi-barreling frequencies for aggressor. |
| wonWhenSawFlopCount | Number of hands won when reaching post-flop. |

**Pattern notes:**
These metrics are incremented individually per player in the game state loop. AIAnalyzer aggregates them from the session files across all history to construct the GLOBAL STATS payload for the Leak Finder. Future statistical additions must follow this two-step architecture (Game Engine OpponentProfiler -> Session JSON -> AIAnalyzer Aggregation).
