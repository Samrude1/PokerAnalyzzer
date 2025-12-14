---
description: Universal meta-workflow for web application development
---

# Universal Web Development Workflow

version: 2.0
name: universal-web-workflow
description: A robust, project-agnostic orchestration for web projects of any scale.

globals:
  goals:
    - "Deliver value iteratively (MVP → Feature → Polish)."
    - "Maintain a 'Working Software' state at all times."
    - "Ensure reproducibility via containerization or strict scripts."
    - "Embed quality gates (Test, Lint, Audit) into the daily loop."
  quality_standards:
    performance: "Lighthouse Score ≥ 90 (or relevant metric)"
    testing: "Critical Path Coverage ≥ 80%"
    security: "Zero critical/high vulnerabilities"
    accessibility: "WCAG 2.1 AA Compliance"

roles:
  - id: architect
    responsibilities:
      - "System design, tech stack selection, cross-cutting concerns."
      - "Decision logs (ADRs) and high-level documentation."
  - id: developer
    responsibilities:
      - "Implementation of features, components, and logic."
      - "Writing unit and integration tests for own code."
  - id: qa_automation
    responsibilities:
      - "E2E test scenarios, regression suites, performance benchmarks."
  - id: ops
    responsibilities:
      - "CI/CD pipelines, infrastructure, security, observability."

phases:
  - name: 0_planning
    steps:
      - id: scope_definition
        owner: architect
        actions:
          - "Define specific goals and non-goals for the milestone."
          - "Create/Update ADRs for major architectural choices."
      - id: repo_setup
        owner: ops
        actions:
          - "Initialize repository with standard structure."
          - "Configure Git hooks (husky), linting, and formatting."

  - name: 1_foundation
    steps:
      - id: environment
        owner: ops
        actions:
          - "Establish reproducible dev environment (Docker/Scripts)."
          - "Configure CI pipeline (Lint → Test → Build)."
      - id: core_architecture
        owner: architect
        actions:
          - "Set up directory structure (monorepo/polyrepo)."
          - "Establish shared libraries/utilities and design tokens."

  - name: 2_execution
    steps:
      - id: implementation
        owner: developer
        actions:
          - "Implement features using TDD/BDD where possible."
          - "Ensure component isolation and reusability."
      - id: continuous_quality
        owner: developer
        actions:
          - "Run local tests and linter before commit."
          - "Draft documentation for new APIs or modules."

  - name: 3_verification
    steps:
      - id: automated_checks
        owner: qa_automation
        actions:
          - "Run full regression suite (Unit + Integration + E2E)."
          - "Execute security scans (dependency audit, SAST)."
      - id: reliability_checks
        owner: qa_automation
        actions:
          - "Performance profiling (Lighthouse/Web Vitals)."
          - "Accessibility audit."

  - name: 4_release
    steps:
      - id: deployment
        owner: ops
        actions:
          - "Deploy to staging environment for auto-smoke tests."
          - "Promote to production upon approval/pass."
      - id: monitoring
        owner: ops
        actions:
          - "Verify health checks and monitor error rates."

  - name: 5_retrospective
    steps:
      - id: feedback
        owner: team
        actions:
          - "Analyze metrics and user feedback."
          - "Update backlog and documentation based on learnings."

automation:
  generators:
    - id: readme_gen
      template: "Standard README structure (Overview, Setup, Tech Stack)."
    - id: adr_gen
      template: "Context, Options, Decision, Consequences."
  checks:
    pre_commit: ["Lint", "Format", "Unit Tests (Staged)"]
    pre_push: ["Build Check"]
    ci_pipeline: ["Full Test Suite", "Security Audit", "Build Production"]