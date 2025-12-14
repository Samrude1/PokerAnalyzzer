AI Meta Workflow for JavaScript Game Development

version: 1 name: meta-ai-js-game-workflow description: Detailed orchestration for AI-assisted JavaScript game development

Globals

Goals:

Deliver playable MVP quickly with iterative improvements.

Ensure modular, reusable code for game mechanics.

Integrate automated testing and documentation.

Quality Gates:

FPS ≥ 60 on target devices.

Unit test coverage ≥ 80%.

Accessibility and performance checks.

Environments:

Dev: Node.js + Browser (Webpack/Vite).

CI: Containerized builds.

Prod: Web deployment (static hosting/CDN).

Roles

Architect: Define game architecture, rendering pipeline, and module boundaries.

GameDev: Implement mechanics, physics, rendering, and UI.

TestEngineer: Design unit/integration tests for mechanics and rendering.

DocWriter: Maintain README, architecture diagrams, and changelogs.

Ops: Handle build pipeline, deployment, and performance monitoring.

Phases

0_Planning

Define scope: core gameplay loop, target platform (browser).

Repo setup: monorepo with src/, assets/, tests/, docs/.

Documentation baseline: README, CONTRIBUTING, CHANGELOG.

1_Foundation

Environment setup: Node.js, bundler (Webpack/Vite), ESLint/Prettier.

Shared libraries: physics engine, rendering helpers, asset loader.

Telemetry: FPS counter, error logging.

2_MVP_Delivery

Core gameplay loop: input handling, rendering, update cycle.

Basic mechanics: player movement, collision detection.

Asset integration: sprites, sounds.

Testing: unit tests for mechanics, integration tests for rendering.

Documentation update: setup instructions, gameplay overview.

3_Quality_Gate

Performance: ensure 60 FPS, optimize rendering.

Security: validate inputs, sandbox external assets.

E2E tests: simulate gameplay scenarios.

Release preparation: versioning, changelog, rollback plan.

4_Release

Staging deploy: host on test server, run smoke tests.

Production deploy: CDN/static hosting, monitor performance.

5_Feedback_Loop

Telemetry review: FPS, error logs, user feedback.

Backlog refinement: prioritize new features or fixes.

Documentation finalize: ADRs, changelog.

Automation

Generators:

Auto-generate README sections (setup, gameplay, testing).

Auto-generate ADRs for major design decisions.

Checks:

FPS ≥ 60.

Unit test coverage ≥ 80%.

E2E tests pass.

Conventions

Commits: conventional commits.

Versioning: semver.

Testing tools: Jest, Playwright.

Security: CSP headers, input validation.

Outputs

Artifacts: dist/ build, docs/ documentation.

Reports: performance logs, coverage reports, changelogs.