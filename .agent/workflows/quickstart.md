---
description: Universal sample projects for testing the workflow
---

# Universal Quickstart

This guide offers a standardized "Hello World" specific to your chosen stack to validate that your development environment and workflows (`setup`, `test`, `deploy`) are functioning correctly.

## Goal
Go from "Empty Folder" to "Deployed App" in < 1 hour to verify your toolchain.

## Choose Your Track

### Track A: Web App (React/Vue/Svelte)
**Project**: "Random Quote Generator"
1. **Setup**: Initialize via `vite` or `create-next-app`.
2. **Feature**: Fetch a quote from free public API (e.g., `api.quotable.io`).
3. **Test**: Unit test the fetch function.
4. **Deploy**: Ship to Vercel/Netlify.

### Track B: Backend API (Node/Python/Go)
**Project**: "Health Check API"
1. **Setup**: Initialize server (Express, FastAPI, Gin).
2. **Feature**: `GET /health` returns JSON `{"status": "ok"}`.
3. **Test**: Integration test the endpoint returns 200.
4. **Deploy**: Ship to Render/Railway/Heroku.

### Track C: CLI Tool (Rust/Python/Node)
**Project**: "File Counter"
1. **Setup**: Standard tooling.
2. **Feature**: Count files in a given directory.
3. **Test**: Mock filesystem and verify count.
4. **Deploy**: Publish to npm/PyPI or build binary.

## Validation Checklist

Regardless of the track, you have succeeded if:

- [ ] Repository is set up with Git & `.gitignore`.
- [ ] You can run the app locally.
- [ ] You can run `npm test` (or equivalent) and it passes.
- [ ] You have a "Live" URL or working binary.
