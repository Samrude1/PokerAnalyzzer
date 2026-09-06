---
name: app-security
description: >-
  Conducts comprehensive security audits, vulnerability scans, and OWASP Top 10 compliance checks.
  Use this skill whenever the user requests a security check, vulnerability scan,
  penetration test review, or runs /security or /sec-audit.
---

# App Security Audit & Vulnerability Scanning Skill

This skill guides the agent in conducting thorough, rigorous security audits for fullstack web applications. It systematically uncovers vulnerabilities, credential leaks, injection risks, authorization flaws, and dangerous package dependencies, logging findings in `.agents/blueprint/SECURITY_AUDIT.md`.

---

## Security Audit Checklist (OWASP Top 10 & Beyond)

### 1. Hardcoded Secrets & Credential Leaks
- Grep codebase for accidental hardcoded secrets:
  - API keys: `sk-`, `ghp_`, `AKIA`, `AIza`, private keys (`BEGIN PRIVATE KEY`).
  - Passwords, connection strings (`postgres://user:password@...`).
- Verify that `.env*` files are strictly listed in `.gitignore`.
- Verify client bundles never import server-side secrets (e.g. Next.js `NEXT_PUBLIC_` misuse).

---

### 2. Injection Flaws (SQL, NoSQL, Command)
- **SQL / ORM**: Check that all database operations use parameterized queries or trusted ORM methods.
  - Flag any raw string template literals inside SQL statements: `db.query(\`SELECT * FROM users WHERE id = ${id}\`)`.
- **Command Injection**: Ensure `exec()`, `spawn()`, or shell commands never pass unsanitized user inputs.

---

### 3. Cross-Site Scripting (XSS) & Content Security
- Search for dangerous HTML injections:
  - React: `dangerouslySetInnerHTML`.
  - Svelte: `{@html ...}`.
  - Vue: `v-html`.
  - Vanilla JS: `innerHTML` or `document.write`.
- Verify user inputs rendered in HTML or emails are properly sanitized (e.g. DOMPurify).
- Check presence of essential security headers:
  - `Content-Security-Policy` (CSP)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` or `SAMEORIGIN`

---

### 4. Cross-Site Request Forgery (CSRF) & CORS
- Verify CORS policy:
  - Disallow wildcard `Access-Control-Allow-Origin: *` on endpoints handling cookies/credentials.
  - Ensure `credentials: 'include'` only pairs with explicit trusted origin whitelists.
- Check state-changing mutations (`POST`, `PUT`, `DELETE`):
  - Ensure session cookies use `SameSite=Lax` or `SameSite=Strict`.

---

### 5. Broken Authentication & Authorization (BOLA / IDOR)
- **Object-Level Access Control (IDOR)**:
  - When fetching or mutating records via an ID parameter (e.g. `/api/documents/:id`), verify the backend asserts `document.userId === currentUserId`.
- **Session & Cookie Hygiene**:
  - Auth cookies MUST use flags: `HttpOnly`, `Secure` (in production), and `SameSite`.
  - Passwords must be hashed with `bcrypt`, `argon2`, or handled by reputable auth providers (Clerk, Supabase, NextAuth).

---

### 6. Dependency Vulnerability Scan
- Run automated package vulnerability audit:
  ```bash
  npm audit
  ```
- Identify High and Critical CVEs and review breaking upgrade paths.

---

## Audit Execution & Deliverables

1. **Conduct the Scan**: Execute the checklist across frontend, API routes, database schemas, and configuration.
2. **Update `.agents/blueprint/SECURITY_AUDIT.md`**:
   - Update the Scorecard table.
   - Record discovered vulnerabilities with severity (Critical, High, Medium, Low) and specific line links.
   - Document concrete remediation steps.
3. **Present Executive Debrief**:
   ```markdown
   ## 🛡️ Security Audit Report

   - **Overall Risk Rating**: 🟢 Low / 🟡 Moderate / 🔴 Critical
   - **Secrets Leaked**: [0 found / Detected in file X]
   - **Injection Risks**: [None detected / Vulnerable line X]
   - **XSS Flaws**: [None detected / Review line X]
   - **Auth / IDOR Gaps**: [Verified / Missing ownership check in Y]
   - **Dependency CVEs**: [X high, Y moderate]

   Detailed remediation report saved to: `.agents/blueprint/SECURITY_AUDIT.md`.
   ```
4. **Immediate Remediation**: Offer to fix critical findings immediately.

---

## Error Handling & Fallbacks

If automated security scanning tools or package audits fail:
1. **`npm audit` Network Failure**: Retry with `--registry=https://registry.npmjs.org/` or inspect network/proxy settings.
2. **False Positives in Regex Secret Scan**: Whitelist placeholder test keys (e.g. `sk-test-12345`) by documenting them explicitly in `SECURITY_AUDIT.md`.
3. **Unfixable Upstream CVEs**: If a package has no fixed release, evaluate replacing the package or adding overrides/resolutions in `package.json`.
4. **Escalate**: If active hardcoded secrets were committed to Git history, guide developer immediately on credential revocation and history rewriting (`git filter-repo` or BFG).

