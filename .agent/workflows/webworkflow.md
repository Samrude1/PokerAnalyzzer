---
description: Detailed orchestration for web/mobile projects
---

# Antigravity AI Meta Workflow

version: 1
name: meta-ai-web-mobile-workflow
description: Detailed orchestration for web/mobile projects

globals:
  goals:
    - "Deliver MVP quickly while maintaining quality and security."
    - "Document decisions in ADR format and ensure reproducibility."
    - "Build CI/CD, tests, and observability in the first sprint."
  quality_gates:
    lighthouse_min: 90
    unit_coverage_min: 0.8
    e2e_required: true
  environments:
    dev: docker_wsl2
    ci: containerized
    prod: cloud_kubernetes

roles:
  - id: architect
    responsibilities:
      - "Define scope, architecture, tech stack, ADRs."
      - "Repo structure (monorepo), baseline CI/CD."
  - id: webdev
    responsibilities:
      - "Next.js/React app, components, APIs, accessibility."
      - "Lighthouse and bundle optimizations."
  - id: mobiledev
    responsibilities:
      - "React Native / Kotlin / Swift implementation, native integrations."
      - "Cold start optimization and testing (Detox/XCUITest)."
  - id: testengineer
    responsibilities:
      - "Unit/integration/e2e test design and execution."
      - "Contract tests and regression protection."
  - id: docwriter
    responsibilities:
      - "README, ARCHITECTURE, ADR, CHANGELOG, CONTRIBUTING."
  - id: ops
    responsibilities:
      - "Infra-as-code, deployment, observability, secrets."

phases:
  - name: 0_planning
    steps:
      - id: define_scope
        owner: architect
        actions:
          - "Document MVP scope and non-goals."
          - "Select stack (web: Next.js+Node, mobile: React Native) and justify via ADR."
      - id: repo_init
        owner: ops
        actions:
          - "Create monorepo: apps/web, apps/mobile, packages/shared, infra, docs."
          - "Add lint/format, commitlint, pre-commit hooks."
      - id: doc_baseline
        owner: docwriter
        actions:
          - "Generate README, ARCHITECTURE, CONTRIBUTING, SECURITY, CHANGELOG skeletons."

  - name: 1_foundation
    steps:
      - id: env_setup
        owner: ops
        actions:
          - "Docker/WSL2 dev containers, pinned versions, make commands: setup, dev, test."
          - "CI pipeline: build→test→lint→scan→deploy (staging)."
      - id: shared_lib
        owner: architect
        actions:
          - "Create packages/shared: UI-kit, utilities, schema validation (Zod)."
      - id: telemetry
        owner: ops
        actions:
          - "OpenTelemetry baseline, request IDs, error boundaries."

  - name: 2_mvp_delivery
    steps:
      - id: web_mvp
        owner: webdev
        actions:
          - "Build critical user flow, configure SSR/ISR."
          - "Accessibility basics: semantic tags, focus management, keyboard navigation."
      - id: mobile_mvp
        owner: mobiledev
        actions:
          - "Build same core flow in mobile, add native modules if needed."
          - "Profile cold start and optimize (target ≤ 2s)."
      - id: api_contracts
        owner: architect
        actions:
          - "Define API contracts (OpenAPI), DTOs, validation."
      - id: testing_mvp
        owner: testengineer
        actions:
          - "Unit coverage ≥ 80% critical modules, integration + e2e scenarios ready."
      - id: docs_update
        owner: docwriter
        actions:
          - "Update README: setup, test commands, quality metrics."

  - name: 3_quality_gate
    steps:
      - id: performance_web
        owner: webdev
        actions:
          - "Lighthouse ≥ 90; bundle size analysis and code-splitting."
      - id: performance_mobile
        owner: mobiledev
        actions:
          - "Analyze jank, optimize rendering, network usage."
      - id: security_scan
        owner: ops
        actions:
          - "Dependency audit, security headers, secret policies."
      - id: e2e_gate
        owner: testengineer
        actions:
          - "E2E pass rate ≥ 95% critical paths; fix flaky tests."
      - id: release_prepare
        owner: docwriter
        actions:
          - "Release notes (conventional commits), ADR links, rollback plan."

  - name: 4_release
    steps:
      - id: staging_deploy
        owner: ops
        actions:
          - "Deploy to staging, run smoke tests automatically."
      - id: prod_deploy
        owner: ops
        actions:
          - "Canary deploy, observability monitoring, rollback readiness."

  - name: 5_feedback_loop
    steps:
      - id: telemetry_review
        owner: architect
        actions:
          - "Analyze metrics: latency, error rate, accessibility, energy usage."
      - id: backlog_refine
        owner: architect
        actions:
          - "Update backlog; remove or deprecate weak features."
      - id: docs_finalize
        owner: docwriter
        actions:
          - "Finalize ADRs and CHANGELOG."

automation:
  generators:
    - id: readme_autogen
      trigger: repo_init, docs_update
      output: docs/README.md
      template:
        sections:
          - "Project description"
          - "Architecture & stack"
          - "Setup (Docker/WSL2)"
          - "Testing commands & metrics"
          - "Deployment & rollback"
          - "Agent orchestration"
    - id: adr_autogen
      trigger: define_scope, api_contracts, release_prepare
      output: docs/decisions/ADR-XXXX.md
      template:
        sections:
          - "Title and status"
          - "Context and problem statement"
          - "Decision drivers"
          - "Considered options"
          - "Decision outcome"
          - "Consequences (positive and negative)"
    - id: changelog_autogen
      trigger: release_prepare, prod_deploy
      output: CHANGELOG.md
      template:
        format: conventional_commits
        sections:
          - "Added"
          - "Changed"
          - "Deprecated"
          - "Removed"
          - "Fixed"
          - "Security"
    - id: architecture_autogen
      trigger: repo_init, shared_lib, api_contracts
      output: docs/ARCHITECTURE.md
      template:
        sections:
          - "System overview and goals"
          - "Tech stack and rationale"
          - "Component diagram"
          - "Data flow and API contracts"
          - "Security architecture"
          - "Deployment architecture"

quality_checks:
  pre_commit:
    - "Lint (ESLint/SwiftLint/Ktlint)"
    - "Format (Prettier)"
    - "Unit tests on changed files"
    - "Commit message validation (commitlint)"
  pre_merge:
    - "Full test suite (unit + integration)"
    - "E2E critical paths"
    - "Security scan (npm audit / dependency check)"
    - "Bundle size check (web)"
    - "Performance regression check"
  pre_deploy:
    - "Lighthouse ≥ 90 (web)"
    - "Cold start ≤ 2s (mobile)"
    - "E2E pass rate ≥ 95%"
    - "Security headers validated"
    - "Smoke tests pass"

decision_resolution:
  conflict_handling:
    - "Architect has final say on architecture decisions"
    - "All conflicts documented in ADR"
    - "Team consensus preferred, escalate if blocked > 24h"
  adr_process:
    - "Create ADR for all significant decisions"
    - "Template: context, options, decision, consequences"
    - "Review by at least 2 roles before merge"
    - "Link ADRs in relevant code comments"

maintenance_schedule:
  daily:
    - "Monitor CI/CD pipeline health"
    - "Review telemetry dashboards"
    - "Triage new issues"
  weekly:
    - "Dependency security updates"
    - "Performance metrics review"
    - "Backlog grooming"
  monthly:
    - "Full dependency updates with regression testing"
    - "Architecture review and technical debt assessment"
    - "Documentation audit and updates"
  quarterly:
    - "Major version planning"
    - "Team retrospective on process"
    - "Bus factor analysis and knowledge transfer"

emergency_procedures:
  production_incident:
    - "Ops: Immediate rollback if critical"
    - "Architect: Assess impact and coordinate fix"
    - "TestEngineer: Reproduce and create regression test"
    - "DocWriter: Update incident log and postmortem"
  security_vulnerability:
    - "Ops: Assess severity (CVSS score)"
    - "Architect: Plan mitigation strategy"
    - "All: Patch within SLA (critical: 24h, high: 7d, medium: 30d)"
    - "DocWriter: Security advisory and changelog update"

success_metrics:
  sprint_completion:
    - "All planned features delivered and tested"
    - "Quality gates passed"
    - "Documentation updated"
    - "Zero critical bugs in production"
  project_health:
    - "CI/CD pipeline green ≥ 95% of time"
    - "Mean time to recovery (MTTR) ≤ 1h"
    - "Test coverage maintained ≥ 80%"
    - "Lighthouse score ≥ 90 maintained"
  team_efficiency:
    - "Sprint velocity stable or improving"
    - "Code review turnaround ≤ 24h"
    - "Deployment frequency ≥ 1/week"
    - "Change failure rate ≤ 15%"