---
name: app-test
description: >-
  Performs automated browser testing and quality verification for fullstack web applications.
  Use this skill whenever the user requests testing, runs /test,
  or after modifying code to verify nothing broke.
---

# App Test & Automated Verification Skill

This skill guides the agent in running automated browser tests for a fullstack web application. In solo development, this functions as the developer's automated QA tester, catching regressions immediately.

---

## Testing Workflow

### Step 1: Environment Initialization
1. Ensure the dev server is running (`npm run dev` or equivalent).
2. Launch `browser_subagent` to perform the automated test session.

---

### Step 2: Browser Subagent Verification Checklist

Instruct the subagent to complete the following checks:

1. **Console Errors**:
   - Check for unhandled exceptions (`Uncaught TypeError`, `ReferenceError`, `404 Not Found`).
   - Check for failed network requests (API errors, missing assets).
2. **Page Load & Rendering**:
   - Verify the app loads without a blank screen.
   - Verify the initial page (landing/home) renders correctly with expected content.
   - Verify navigation elements (header, sidebar, footer) are present.
3. **Navigation & Routing**:
   - Click through primary navigation links.
   - Verify each page loads without errors.
   - Verify browser back/forward works correctly.
4. **Forms & Interaction**:
   - Test form inputs (typing, selecting, submitting).
   - Verify form validation messages appear correctly.
   - Test button clicks and interactive elements.
5. **Responsive Layout**:
   - Resize browser to mobile width (375px) and verify layout adapts.
   - Resize to tablet (768px) and desktop (1280px).
   - Check for horizontal overflow or broken layouts.
6. **Authentication Flow** (if applicable):
   - Test login/register page rendering.
   - Verify protected routes redirect to login when unauthenticated.
7. **Visual Screenshot**:
   - Capture screenshots of key pages for the test report.

---

### Step 3: Test Report for Developer

Present a concise summary:

```markdown
## 🧪 Automated Verification Report

### Overview
- **Status**: ✅ PASSED / ❌ ISSUES DETECTED
- **Pages Tested**: [count]
- **Console Errors**: [0 found / error count & snippets]
- **Responsive**: [Verified at mobile/tablet/desktop / Issues found]

### Observations
- [Observation 1: Home page loads cleanly with all components]
- [Observation 2: Navigation works across all routes]
- [Observation 3: Forms validate and submit correctly]

### Visual State
[Screenshot attachments]
```

If errors are detected, propose immediate resolution or transition to `/debug`.

---

## Error Handling & Fallbacks

If automated browser testing cannot initialize or run:
1. **Dev Server Not Running / Port Mismatch**: Verify active port (`3000`, `5173`, etc.) before initializing browser navigation.
2. **Browser Subagent Navigation Failure**: If the subagent fails to connect, inspect local firewall or dev server logs.
3. **Flaky / Dynamic Element Selectors**: Prefer robust accessibility selectors (`role`, `aria-label`, visible text) over fragile CSS path selectors.
4. **Escalate**: If persistent uncaught exceptions crash the browser page, capture the console traceback and immediately invoke `/debug`.

