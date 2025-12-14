AI Meta Workflow for Mobile App Development

version: 1 name: meta-ai-mobile-app-workflow description: Workflow for orchestrating AI-assisted mobile app development projects

Globals

Goals:

Deliver functional MVPs quickly with iterative improvements.

Ensure modular, reusable code for mobile features.

Integrate automated testing, CI/CD, and documentation.

Quality Gates:

App launch time ≤ 2 seconds.

Unit test coverage ≥ 80%.

Accessibility and performance checks.

Environments:

Dev: React Native / Kotlin / Swift.

CI: Containerized builds.

Prod: App Store / Google Play deployment.

Roles

Architect: Define app architecture, navigation flow, and module boundaries.

MobileDev: Implement features, UI components, native integrations.

TestEngineer: Design unit/integration/e2e tests for app features.

DocWriter: Maintain README, architecture diagrams, and changelogs.

Ops: Handle build pipeline, deployment, and monitoring.

Phases

0_Planning

Define scope: core features, target platforms (iOS/Android).

Repo setup: src/, assets/, tests/, docs/.

Documentation baseline: README, CONTRIBUTING, CHANGELOG.

1_Foundation

Environment setup: React Native/Kotlin/Swift, ESLint/Prettier.

Shared libraries: UI kit, API client, asset loader.

Telemetry: crash reporting, performance monitoring.

2_MVP_Delivery

Core features: navigation, authentication, data storage.

Basic UI: forms, lists, detail views.

Native integrations: camera, notifications.

Testing: unit tests for features, integration tests for navigation.

Documentation update: setup instructions, feature overview.

3_Quality_Gate

Performance: ensure launch time ≤ 2s, optimize rendering.

Security: validate inputs, secure storage.

E2E tests: simulate user flows.

Release preparation: versioning, changelog, rollback plan.

4_Release

Staging deploy: test builds on devices/emulators.

Production deploy: App Store/Google Play submission, monitor performance.

5_Feedback_Loop

Telemetry review: crash logs, performance metrics, user feedback.

Backlog refinement: prioritize new features or fixes.

Documentation finalize: ADRs, changelog.

Automation

Generators:

Auto-generate README sections (setup, features, testing).

Auto-generate ADRs for major design decisions.

Checks:

Launch time ≤ 2s.

Unit test coverage ≥ 80%.

E2E tests pass.

Conventions

Commits: conventional commits.

Versioning: semver.

Testing tools: Jest, Detox, XCUITest.

Security: secure storage, input validation.

Outputs

Artifacts: build/ app binaries, docs/ documentation.

Reports: performance logs, coverage reports, changelogs.