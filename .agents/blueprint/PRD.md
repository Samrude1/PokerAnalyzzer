# Product Requirements Document (PRD.md) — Poker Analytics Engine

This document specifies the reverse-engineered product requirements, user personas, gameplay systems, and AI integration for the Poker Analytics Engine.

---

## 1. Overview
- **Project Name**: Poker Analytics Engine
- **Type**: Interactive Poker Simulator & AI Coaching Platform (Fullstack Web Application)
- **Target Users**: Poker players (beginners to advanced grinders) looking to practice No-Limit Texas Hold'em (NLHE), review past hands, analyze database stats, and receive AI-driven strategic leak detection.
- **Tech Stack**:
  - **Frontend**: React 18.2, TypeScript 5.2, Vite 5.0, TailwindCSS 3.4, React Router 7.10, Recharts 3.5, Lucide / custom icons
  - **Backend**: Node.js, Express 5.2, Helmet, Express-Rate-Limit, JSON Web Tokens (JWT), Zod 4.4
  - **Storage**: Hierarchical JSON file system (`database/<username>/<mode>/sessions/<DDMMYYYY>/`)
  - **AI Provider**: OpenRouter API (`anthropic/claude-3.5-sonnet` / configurable LLM)
- **Design Aesthetic**: Dark mode, poker table felt green (`#35654d`), dark charcoal backgrounds (`#111827`, `#1a1a1a`), gold accents (`#d4af37`), and card suite iconography.
- **Deployment Target**: Local / Self-Hosted Node.js / Docker / Cloud VM (Fullstack dual-process).

---

## 2. Core Features & User Stories

### 2.1 Gameplay & Poker Engine
- **Cash Games**: Configurable difficulty (Beginner, Intermediate, Pro, Mixed) with 6-max table, automatic blinds, dealer button rotation, side pots, rebuy/auto-top-off mechanics.
- **Tournaments (MTT)**: Up to 50 simulated players across multiple tables, blind level escalations, table rebalancing, final table transition overlay, and ITM prize distribution.
- **Bot Personalities**:
  - *Fish (Beginner)*: Loose-Passive (VPIP 45-60%, PFR 10-15%), calls down frequently, rarely raises.
  - *Nit (Intermediate)*: Tight-Passive (VPIP 15-20%, PFR 12-16%), plays only premium starting hands.
  - *TAG (Advanced)*: Tight-Aggressive (VPIP 20-25%, PFR 18-22%), balanced, position-aware.
  - *LAG (Pro)*: Loose-Aggressive (VPIP 28-35%, PFR 22-28%), frequent 3-bets, delayed c-bets, exploitative.
- **HUD & Live Statistics**: Real-time player tracking for VPIP, PFR, 3-Bet%, Aggression Factor (AF), M-ratio, and positional stats.

### 2.2 Analytics & Statistics Dashboard
- **Session History**: Detailed session summaries tracking profit/loss, hands played, duration, and win rates.
- **Interactive Hand Replayer / Viewer**: Hand-by-hand action logs, hole cards, street-by-street actions, and showdown results.
- **Positional Heatmap & Matrix**: VPIP/PFR/ATS broken down by position (UTG, MP, CO, BTN, SB, BB).
- **Showdown & C-Bet Math**: Flop/Turn/River C-bet dropoff charts, WTSD%, W$SD%, W$WSF%.

### 2.3 Hand History Importer
- **PokerStars Parser**: Import raw text hand histories via drag-and-drop or clipboard paste.
- **Metadata Extraction**: Parse blinds, hand IDs, table sizes, positions, actions, and chip movements into uniform JSON session structures.

### 2.4 AI Poker Coach (OpenRouter)
- **Deterministic Pre-computation**: Hand strength, action classifications (e.g. 3-bet vs iso-raise), and opponent tendencies are evaluated mathematically before LLM injection, preventing hallucinations.
- **Session Review**: Evaluates session performance, identifies missed sizing or loose calls, and flags exploitative leaks.
- **Global Leak Finder**: Queries cumulative database stats across all sessions to diagnose macro weaknesses (e.g. high fold-to-3-bet, passive turn aggression).
- **Interactive Coaching Chat**: Real-time SSE streaming chat with Claude 3.5 Sonnet grounded in player hand history context.

---

## 3. Pages & Routes

| Page | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **Login / Register** | `/login` | Public | Stateless JWT authentication, credentials entry |
| **Lobby (Home)** | `/` | Private | Game mode selection (Cash vs MTT), difficulty selector, quick lifetime metrics |
| **Game Table** | `/play` | Private | Live interactive poker table, betting controls, HUD, showdown cards, sound effects |
| **Hand Importer** | `/import` | Private | PokerStars hand history file drop and text parser |
| **Statistics** | `/stats` | Private | Visual graphs (Recharts), positional matrix, c-bet falloff, session list |
| **AI Coach** | `/coach` | Private | Interactive LLM chat interface, Global Leak Finder, Session Review actions |

---

## 4. API & Data Contracts

### 4.1 Authentication
- `POST /api/register` — Create user account with `{ username, password }`.
- `POST /api/login` — Authenticate and receive `{ id, username, isPro, token }`.

### 4.2 Sessions & Hands
- `GET /api/sessions` — Fetch list of saved sessions for authenticated user.
- `POST /api/sessions` — Save or update session record `{ id, mode, date, handsPlayed, chipsWon, ... }`.
- `DELETE /api/sessions/:sessionId` — Delete session record and associated hands.
- `GET /api/hands/:sessionId` — Retrieve all hand histories for a given session.
- `POST /api/hands` — Persist newly played or imported hand history batch.

### 4.3 AI Coach
- `GET /api/coach/health` — Check backend connection & OpenRouter model availability.
- `POST /api/coach/chat` — Server-Sent Events (SSE) stream for interactive chat, session reviews, and global leak finder queries.

---

## 5. Non-Functional Requirements & Acceptance Criteria
- [x] Deterministic game engine with comprehensive unit tests for hand evaluation and bot logic.
- [ ] Production build passes clean TypeScript check (`npm run build`). *(Currently blocked by TS6133 in StorageService)*
- [ ] ESLint config established and passing (`npm run lint`).
- [ ] Passwords salted and hashed securely (bcrypt/argon2) rather than plaintext storage.
- [ ] Proper JWT secret management via environment variables with strong random fallbacks.
- [ ] Complete responsive layout from 1024px desktop down to tablet/mobile viewports.
