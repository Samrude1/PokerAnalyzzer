# Memory — Local JSON Database & Stats Separation

Last updated: 2026-07-07

## What was built

- **Local JSON Backend**: Created a Node.js Express server (`server/server.js`) that persists all users, sessions, and hands to a permanent `database.json` file.
- **Registration & Auth**: Overhauled `LoginPage.tsx` and `AuthContext.tsx` to support real user registration with passwords, hitting the new local backend API.
- **Async Storage**: Converted `StorageService.ts` from synchronous `localStorage` to async `fetch()` calls to the backend API. Updated UI components (`HomePage.tsx`, `ImportPage.tsx`) to handle async data loading.
- **Stats Separation**: Updated `TournamentManager.ts` and `GamePage.tsx` to track `mode` (cash vs tournament). Tournaments now accurately record net profit (prize - buy-in), placement, and total players.
- **HUD Update**: Replaced Session Profit/Loss with M-Ratio tracking in the in-game HUD.
- **Concurrent Dev Environment**: Updated `package.json` to use `concurrently`, launching both the Vite frontend and Node backend simultaneously with `npm run dev`.

## Decisions made

- **Database Choice**: Chose a flat `.json` file over SQLite or IndexedDB to provide extreme simplicity while solving the "browser cache clear" data loss problem.
- **Authentication Security**: Since this is a local toy app for friends, passwords are saved in plain text in `database.json` to keep the backend extremely lightweight.
- **UI Stats**: `HomePage.tsx` defaults to displaying Cash Game stats, but toggles to a completely different layout for Tournament stats (showing ITM% and Net Profit).

## Problems solved

- Fixed the `AuthContext` bug where a new random user ID was generated on every login, causing data loss.
- Addressed `HomePage` rendering before async sessions were loaded by implementing a loading state and `useEffect`.

## Current state

- The game is fully functional with a permanent local backend.
- Registration works, stats are correctly separated by mode, and data persists securely on the local hard drive.

## Next session starts with

- Implementing the next major roadmap feature, such as the **Leak finder with automated analysis** or the **Hand database with search/filter**.

## Open questions

- None at the moment.
