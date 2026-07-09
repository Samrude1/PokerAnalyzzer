# Memory — Security Audit & API Hardening

Last updated: 2026-07-09

## What was built

- **JWT Authentication**: Implemented `jsonwebtoken` in `server.js` and securely integrated it into the frontend (`AuthContext`, `StorageService`, `CoachService`) to protect API endpoints and prevent IDOR vulnerabilities.
- **Zod Validation**: Added strict runtime schema validation for all API inputs to prevent malformed data and injection attacks.
- **Infrastructure Security**: Deployed `helmet` for HTTP security headers, strict CORS configuration (restricting access to `FRONTEND_URL`), and `express-rate-limit` to prevent brute force attacks on `/api/login` and rate-limit the LLM-powered `/api/coach/chat` endpoint.

## Decisions made

- Replaced simplistic user ID payload checks with a standard JWT `Authorization: Bearer <token>` flow.
- Added explicit rate-limiters: 20 requests/15min for Auth, and 50 requests/15min for Coach.

## Problems solved

- **Data Privacy (IDOR)**: Fixed a major flaw where anyone could retrieve or modify someone else's sessions just by sending their `userId`. Now `userId` is strictly extracted from `req.user.id` (via the signed JWT).
- **Wildcard CORS**: Restricted API access exclusively to the known frontend client.
- **Rate Limiting**: Prevented infinite spamming of the expensive OpenRouter AI endpoint.

## Current state

- The backend is significantly more robust, strictly adhering to the `api-development-workflow.md` and passing the `security-audit-workflow.md`.
- All tests pass (30/30).

## Next session starts with

- Test the AI Coach with a new, complex session to verify the TAG/GTO strategy instructions.

## Open questions

- None. Security audit completed and findings remediated.
