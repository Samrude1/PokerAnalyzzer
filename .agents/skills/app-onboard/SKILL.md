---
name: app-onboard
description: >-
  Audits and reverse-engineers an existing or legacy fullstack web application project.
  Use this skill whenever the user asks to onboard an existing codebase, audit code,
  take over a project, or runs /onboard or /audit.
  Generates a full project status and blueprint (.agents/blueprint/).
---

# App Onboarding & Codebase Audit Skill

This skill guides the agent in systematically taking over an existing, unfinished, or legacy fullstack web application. Its objective is to evaluate the codebase, create persistent blueprint documentation (`.agents/blueprint/`), and establish an actionable roadmap before any modifications are made.

---

## Workflow Steps

### Step 1: Deep Codebase Audit
Examine all project files using exploration tools (`list_dir`, `view_file`, `grep_search`):

1. **Project Configuration**:
   - Check `package.json`: framework, dependencies, scripts, Node version.
   - Check for TypeScript (`tsconfig.json`), linting (`eslint.config.*`), and formatting configs.
   - Check environment setup: `.env.example`, `.env.local`, environment variable usage.
2. **Frontend Architecture**:
   - Identify routing approach (file-based, manual router).
   - Evaluate component structure: Are components reusable and composable?
   - Check styling approach: CSS Modules, Tailwind, styled-components, vanilla CSS? Are design tokens used?
   - Assess responsive design: Are breakpoints consistent? Mobile-friendly?
3. **Backend & API**:
   - Identify API routes and their handlers.
   - Check input validation, error handling, and response format consistency.
   - Assess middleware usage (auth, CORS, rate limiting).
4. **Database & Data Layer**:
   - Identify database type and ORM/query builder.
   - Check schema definitions and migration state.
   - Assess data validation and sanitization.
5. **Authentication & Authorization**:
   - Identify auth provider and strategy.
   - Check session/token management.
   - Verify protected route enforcement.
6. **Security Posture**:
   - Check for hardcoded secrets or API keys in source.
   - Assess CORS, CSRF, and XSS protections.
   - Check for raw SQL queries or unsafe interpolations.
7. **Testing & Quality**:
   - Identify test framework and existing test coverage.
   - Check for CI/CD configuration.

---

## Step 2: Generate Blueprint Documentation (.agents/blueprint/)
Synthesize findings into persistent blueprint files:

1. **`.agents/blueprint/PRD.md`**: Reverse-engineered product requirements (core features, user flows, pages).
2. **`.agents/blueprint/ARCHITECTURE.md`**: Technical architecture diagram (Mermaid), directory responsibilities, data flow, and refactoring needs.
3. **`.agents/blueprint/STYLE_GUIDE.md`**: Extracted design tokens (colors, spacing, typography) from existing CSS.
4. **`.agents/blueprint/PROJECT_STATUS.md`**:
   - Estimated completion percentage (0–100%).
   - Feature Matrix (Done, In Progress, Missing).
   - Technical Debt and identified risks.
   - Prioritized Action Plan for upcoming sprints.

---

## Step 3: Executive Debrief to Developer
Deliver a concise executive debrief:

```markdown
## 🔍 Project Onboarding & Audit Report

### 1. Executive Summary
- **Project**: [App type and stack]
- **Completion**: [Estimated %]
- **Current State**: [1-2 sentence high-level summary]

### 2. What Works Well (The Good)
- [Positive architectural strengths]

### 3. Technical Debt & Risks (Areas for Improvement)
- [Critical issues: missing validation, security gaps, no tests, inconsistent styling]

### 4. Proposed Action Plan (Next Steps)
1. [First logical fix or feature]
2. [Second step]

Full blueprint saved to: `.agents/blueprint/`.
```

Conclude by asking developer confirmation: *"Would you like me to start with step 1?"*

---

## Error Handling & Fallbacks

If any step in the onboarding audit fails:
1. **Unrecognized Framework or Monorepo**: If project layout deviates from standard conventions, search for root build files (`pnpm-workspace.yaml`, `lerna.json`, `turbo.json`) and audit package by package.
2. **Missing Dependencies / Incomplete Clone**: Note uninstalled packages or broken imports in `PROJECT_STATUS.md` as immediate technical debt.
3. **Escalate**: If critical architectural components cannot be inferred, ask the developer for clarification before making assumptions in the blueprint.

