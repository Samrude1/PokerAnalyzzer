# Memory — OpenRouter Migration & AI Coach Refactoring

Last updated: 2026-07-09

## What was built

- **Cloud LLM Migration:** Completely ripped out the local Ollama implementation (`OllamaService.js`, `VectorStore.js`, `RAGPipeline.js`, and all vector `.json` indices). Replaced it with `OpenRouterService` to route requests to cloud models.
- **Smart Analytics Engine (`AIAnalyzer.js`):** Built a pipeline that bypasses vector search entirely. It directly parses local session files to build context dynamically, calculating global VPIP/PFR stats and isolating the 40 most impactful hands for Leak Finder, or grabbing all hands chronologically for Session Reviews.
- **Frontend Security Cleanup:** Removed the Settings panel from `CoachPage.tsx`. The frontend no longer stores or sends the API key. All security is managed backend-side via `.env` (`OPENROUTER_API_KEY`).
- **UI & UX Improvements:** Fixed the "Analysis Context" dropdown. Sessions are now sorted newest-first, and labels show the exact time and chip count. If a user triggers a Session Review while "Global History" is selected, the system automatically falls back to reviewing the newest session instead of failing.
- **Strategy System Prompt:** Upgraded the AI's internal prompts to strictly act as an elite professional focused on modern GTO and exploitative TAG strategy. It is explicitly instructed to be ruthless about bad plays (e.g., calling wide in the BB).

## Decisions made

- **Abandon Local AI:** Decided the user's local hardware (4GB VRAM) and small models (Qwen 4B) were fundamentally insufficient for complex poker reasoning. Shifted entirely to OpenRouter.
- **Abandon RAG for Session Data:** Poker hands are small enough to fit inside modern LLM context windows (e.g., Claude 3.5 has a 200k window). Dropped the vector database entirely in favor of chronological text injection to maintain pure context and avoid splitting up session continuity.
- **Model Choice:** Default model set to `~anthropic/claude-sonnet-latest` via OpenRouter to guarantee state-of-the-art strategic reasoning.

## Problems solved

- **Wrong Session Bug:** Fixed an issue where the user accidentally analyzed their oldest 10-hand session because the UI dropdown labeled all sessions identically ("8.7.2026 - CASH").
- **Server Crashes:** Fixed a `ReferenceError` crash during server boot regarding `__dirname` and `dotenv` initialization order.
- **OpenRouter 404 Errors:** Fixed a 500 error where the server crashed trying to request a non-existent explicit model ID (`anthropic/claude-3.5-sonnet`).

## Current state

- The application uses OpenRouter securely via `.env`.
- The AI Coach responds immediately without requiring manual "Indexing".
- The session selection logic correctly maps frontend IDs to backend file paths.
- The server is stable and running cleanly.

## Next session starts with

- Test the AI Coach with a new, complex session to verify that the elite TAG/GTO strategy instructions result in higher-quality, accurate poker advice without hallucinating.

## Open questions

- Will Claude Sonnet stay within context limits if the user plays a massive 2,000-hand session, or will we need to implement a chunking system later?
