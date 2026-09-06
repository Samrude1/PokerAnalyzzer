---
name: app-debug
description: >-
  Diagnoses, locates, and fixes bugs and technical defects in fullstack web applications.
  Use this skill whenever the user reports a bug, blank screen, API failure, build error,
  or runs /debug or /fix.
---

# App Debug & Diagnostics Skill

This skill guides the agent in conducting systematic troubleshooting for fullstack web applications. Its goal is to isolate root causes quickly, apply clean architectural fixes, and document findings to prevent regressions.

---

## Diagnostic Workflow

### Step 1: Symptom Mapping
Clarify the issue:
1. **What is happening?** (Blank screen, hydration error, API 500, auth failure, build crash, CORS error, styling broken?)
2. **When does it occur?** (At page load, after navigation, on form submit, in production only, on specific device?)

---

### Step 2: Root Cause Checklist

Investigate common fullstack failure modes:

#### 1. Blank Screen or Hydration Error
- Check browser console for hydration mismatch errors (server vs client HTML).
- Check for missing or misspelled component imports.
- Check for client-only APIs used during server-side rendering (`window`, `document`, `localStorage`).
- Check for unhandled Promise rejections in data fetching.

#### 2. API Failures (500, 404, CORS)
- Check API route handler: is the function exported correctly?
- Check database connection: is the connection string correct and the database accessible?
- Check input validation: is the request body/params parsed correctly?
- Check CORS configuration: are the correct origins allowed?
- Check authentication middleware: is the token/session being validated?

#### 3. Authentication & Authorization Issues
- Check auth provider configuration (API keys, redirect URLs, callback routes).
- Check session/token storage and expiry.
- Check protected route middleware: is it applied to all required routes?
- Check for cookie domain/path mismatches between frontend and API.

#### 4. Build & Deployment Failures
- Check for TypeScript errors: `npx tsc --noEmit`.
- Check for ESLint errors: `npm run lint`.
- Check for missing environment variables in production vs development.
- Check dependency version conflicts in `package-lock.json`.

#### 5. Styling & Layout Breakage
- Check for CSS specificity conflicts or missing imports.
- Check for responsive breakpoint issues (missing media queries).
- Check for z-index stacking context problems.
- Verify components are using `STYLE_GUIDE.md` design tokens.

---

### Step 3: Implement & Verify Fix
1. Pinpoint the exact file and line.
2. Implement the fix maintaining architectural standards per `.agents/rules/fullstack-dev.md`.
3. Run the dev server and verify the fix in the browser.
4. Ensure the fix doesn't break existing functionality.

---

### Step 4: Bug Registry Update (.agents/blueprint/KNOWN_BUGS.md)
Document the resolution in `.agents/blueprint/KNOWN_BUGS.md`:
- Date & Symptom
- Root Cause
- Resolution & Modified Files

---

## Error Handling & Fallbacks

If diagnostic investigation fails to identify root cause:
1. **Reproduce in Isolation**: Create a minimal reproduction script or test case in `tests/` or scratch directory.
2. **Binary Search (Git Bisect)**: If the bug is a recent regression, identify the last known good commit using `git bisect`.
3. **Avoid Guesswork Fixes**: Never apply speculative trial-and-error patches that compromise code cleanliness.
4. **Escalate**: If the bug stems from an upstream package defect or environment-level driver, provide the issue tracking link and document temporary workarounds in `KNOWN_BUGS.md`.

