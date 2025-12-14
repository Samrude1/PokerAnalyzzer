---
trigger: always_on
---

# Antigravity AI Global Rules

## Core Principles
- **Transparency:** All AI decisions must be documented (prompts, decision logs, changelogs).
- **Reproducibility:** Development environments must be reproducible (Docker/WSL2, pinned versions, setup scripts).
- **Minimal First:** Deliver the smallest working MVP before expanding scope. Define sprint boundaries clearly.
- **Testability:** Every feature must have unit, integration, and e2e tests before merging.
- **Performance & Accessibility:** Web: Lighthouse ≥ 90, a11y compliance (WCAG). Mobile: cold start ≤ 2s target.
- **Security:** Security headers, input validation, secret management (env → vault), dependency audits.

## Project Structure
- **Repo Layout:** monorepo (apps/, packages/, infra/, docs/)
- **Documentation:** README, ARCHITECTURE, DECISIONS (ADR), CONTRIBUTING, SECURITY, CHANGELOG
- **Configuration:** `.editorconfig`, `.gitignore`, lint/format rules, pre-commit hooks
- **CI/CD:** Build → test → lint → security scan → deploy → smoke test (baseline pipeline for all projects)

## README Minimum Requirements
- **Project description:** short summary, main goal, scope
- **Architecture:** high-level diagram and tech stack
- **Setup:** dev environment (WSL2/Docker), commands, env examples
- **Testing:** commands, reporting, coverage targets
- **Deployment:** environments, versioning, rollback process
- **Quality metrics:** Lighthouse, bundle size, e2e pass thresholds
- **Agent orchestration:** agents used, roles, interfaces, responsibilities

## Code Quality & Style
- **Lint & format:** ESLint + Prettier (web), SwiftLint/Ktlint (mobile), commitlint
- **Folder structure:** feature-first or domain-driven; avoid god-modules
- **Interfaces:** clear DTOs, schema validation (Zod/Yup), standardized error handling

## Testing Requirements
- **Unit:** coverage ≥ 80% for critical modules
- **Integration:** API/DB/mocks, contract tests
- **E2E:** Cypress/Playwright (web), Detox/XCUITest (mobile) required for sprint “done”

## Performance & Observability
- **Profiling:** build reports, bundle analysis (web), render traces
- **Telemetry:** OpenTelemetry, metrics: latency, error rate, cold start, energy usage (mobile)
- **Logging:** structured logs, correlatable request IDs

## Security & Compliance
- **Secrets:** never in repo, `.env.local` → vault → kube secret
- **Audits:** `npm audit`/`gradle dependencyCheck` in CI, fix SLA
- **Privacy:** data minimization, consent management, DPA checklist

## Agent Usage
- **Roles:** Architect, WebDev, MobileDev, TestEngineer, DocWriter, Ops
- **Coordination:** one Workflow Controller orchestrates; conflicts resolved via ADR
- **Decision log:** agent decisions documented in `docs/decisions/ADR-XXXX.md`

## Release & Versioning
- **SemVer:** feature → minor, breaking → major
- **Release notes:** auto-generated (conventional commits), ADR links
- **Rollback:** documented path and smoke tests ready

## Maintenance
- **Backlog grooming:** biweekly; deprecated features removed systematically
- **Dependency updates:** monthly, regression tests for performance & a11y
- **Bus factor:** critical modules must have backup owner/agent