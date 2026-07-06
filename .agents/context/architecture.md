# Architecture Context

## Stack
- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Build Tool**: Vite
- **State Management**: React Context + LocalStorage
- **Testing**: Vitest

## Core Systems
- `PokerGame.ts` — Central game engine managing hand lifecycle, betting rounds, pot management, and state machine.
- `HandEvaluator.ts` — Hand ranking system (7-card combinations).
- `BoardAnalyzer.ts` — Texture analysis for community cards.
- `Deck.ts` — Card management and shuffling.
- `BotLogic.ts` — AI decision tree for pre-flop and post-flop decisions.
- `OpponentProfiler.ts` — Tracks player tendencies.

## State Management
- **Auth Context**: User authentication state (demo login).
- **Session Data**: Stored in LocalStorage.
