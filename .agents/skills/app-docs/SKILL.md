---
name: app-docs
description: >-
  Generates, updates, and synchronizes production-grade project documentation.
  Use this skill whenever the user asks for documentation, runs /docs, /doc,
  or requests a full studio documentation suite with /docs --all.
---

# App Documentation & Studio Standards Skill

This skill guides the agent in generating and maintaining professional, studio-quality project documentation. It eliminates documentation debt by standardizing on recognized industry specifications: **Standard Readme**, **Keep a Changelog**, **MADR (Architectural Decision Records)**, **OpenAPI/REST**, and **Production Operations Runbooks**.

---

## ⚡ Command Matrix & Invocation Modes

The developer can trigger documentation either in **full suite mode** or via **targeted commands**:

| Command | Mode | Deliverables |
| :--- | :--- | :--- |
| **`/docs`**, **`/docs --all`**, **`/docs full`** | **Full Studio Suite** | Generates/updates all 5 core documents: `README.md`, `CHANGELOG.md`, `RUNBOOK.md`, `API.md`, and initial `docs/adr/0001-*.md` |
| **`/docs readme`** | Targeted | Generates/updates `README.md` according to the Standard Readme specification |
| **`/docs changelog`** | Targeted | Generates/updates `CHANGELOG.md` using the Keep a Changelog format & recent git commits |
| **`/docs runbook`** | Targeted | Generates/updates `RUNBOOK.md` (incident triage, emergency rollback, health probes) |
| **`/docs api`** | Targeted | Scans backend endpoints (`/api/...`) and generates `API.md` contracts |
| **`/docs adr [title]`** | Targeted | Creates a new Architectural Decision Record in `docs/adr/XXXX-[title].md` |

---

## 📚 Core Document Standards & Templates

All generated documents must strictly adhere to the reference templates stored in `resources/`:

1. **`README.md`** → [`resources/README_TEMPLATE.md`](./resources/README_TEMPLATE.md)
   - Follows [Standard Readme](https://github.com/RichardLitt/standard-readme) specification.
   - Includes: Hero badges, visual demo link, feature list, tech stack matrix, prerequisites, copy-pasteable quickstart, environment variables table, and scripts.
2. **`CHANGELOG.md`** → [`resources/CHANGELOG_TEMPLATE.md`](./resources/CHANGELOG_TEMPLATE.md)
   - Follows [Keep a Changelog](https://keepachangelog.com/) + SemVer.
   - Categorized sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
3. **`RUNBOOK.md`** → [`resources/RUNBOOK_TEMPLATE.md`](./resources/RUNBOOK_TEMPLATE.md)
   - Production operations guide: health verification (`/api/health`), Sentry alerts, instant rollback steps (< 30s), database restore, and secret rotation.
4. **`API.md`** → [`resources/API_TEMPLATE.md`](./resources/API_TEMPLATE.md)
   - RESTful endpoint specification: HTTP methods, URL routes, auth levels, Zod payload schemas, and uniform `{ success, data, error }` envelopes.
5. **Architectural Decision Records (`docs/adr/`)** → [`resources/ADR_TEMPLATE.md`](./resources/ADR_TEMPLATE.md)
   - MADR (Markdown Architectural Decision Records) format: Context, Drivers, Options, and Consequences.

---

## Workflow: Full Documentation Suite (`/docs --all` or `/docs`)

When the developer requests full documentation generation:

### Step 1: Deep Project Inspection
Gather ground truth across the repository:
1. Read `.agents/blueprint/PRD.md` and `PROJECT_STATUS.md` for project scope, name, and feature list.
2. Read `.agents/blueprint/ARCHITECTURE.md` for tech stack, routing strategy, and database setup.
3. Read `package.json` for dependencies, project scripts, and versions.
4. Read `.env.example` to extract all environment variables and descriptions.
5. Inspect `git log -n 20 --oneline` to summarize recent commit history.
6. List all API handlers in `src/app/api/` or `src/api/` to map endpoints.

---

### Step 2: Generate or Synchronize `README.md`
1. Populate `README.md` using [`resources/README_TEMPLATE.md`](./resources/README_TEMPLATE.md).
2. Ensure every script from `package.json` is listed in the Scripts table.
3. Ensure every variable from `.env.example` is documented with purpose and sample value.
4. Link to `RUNBOOK.md` and `ARCHITECTURE.md`.

---

### Step 3: Generate or Synchronize `CHANGELOG.md`
1. Populate `CHANGELOG.md` using [`resources/CHANGELOG_TEMPLATE.md`](./resources/CHANGELOG_TEMPLATE.md).
2. Group recent Git commits into `[Unreleased]` or current release tag (`[1.0.0]`).
3. Categorize changes cleanly into `Added`, `Changed`, `Fixed`, or `Security`.

---

### Step 4: Generate `RUNBOOK.md` (Operations & Recovery)
1. Populate `RUNBOOK.md` using [`resources/RUNBOOK_TEMPLATE.md`](./resources/RUNBOOK_TEMPLATE.md).
2. Customize rollback instructions for the project's actual deployment target (Vercel, Netlify, Docker).
3. Document database backup & restore command tailored to the chosen database (Postgres/Supabase/SQLite).

---

### Step 5: Generate `API.md` (API Reference)
1. Populate `API.md` using [`resources/API_TEMPLATE.md`](./resources/API_TEMPLATE.md).
2. Document all existing endpoints, their auth requirements, and expected request/response formats.

---

### Step 6: Create Initial Architectural Decision Record (ADR)
1. Ensure directory `docs/adr/` exists.
2. If no ADRs exist, create `docs/adr/0001-record-architecture-decisions.md` capturing the chosen tech stack, framework rationale, and database selection.

---

### Step 7: Delivery Report for Developer
Deliver a concise executive summary:

```markdown
## 📚 Studio Documentation Suite Complete

- **`README.md`**: ✅ Standard Readme format with badges, env table, and quick start.
- **`CHANGELOG.md`**: ✅ Keep a Changelog standard synced with Git commit history.
- **`RUNBOOK.md`**: ✅ Production operations, instant rollback, and health probe procedures.
- **`API.md`**: ✅ Endpoint contracts and JSON response envelopes documented.
- **`docs/adr/`**: ✅ Initial Architecture Decision Record (ADR 0001) established.

All documentation is synchronized with current codebase and `.agents/blueprint/`.
```

---

## Error Handling & Fallbacks

If documentation generation encounters missing context:
1. **Missing `.env.example`**: Scan source code for `process.env.*` references, generate `.env.example` first, then document in `README.md`.
2. **Missing Git History (Fresh Repo)**: Initialize `CHANGELOG.md` with version `[1.0.0]` capturing initial features from `PRD.md`.
3. **Escalate**: If application purpose or target audience is ambiguous, prompt the developer with a brief 1-sentence confirmation rather than inventing unverified product claims.
