---
description: Universal testing strategy and quality gates
---

# Universal Testing Workflow

This workflow defines a comprehensive testing strategy applicable to any software project, emphasizing the "Testing Pyramid" and automated quality gates.

## 1. Testing Pyramid Levels

### Unit Tests (The Base)
- **Scope**: Individual functions, classes, or components in isolation.
- **Speed**: Extremely fast (<10ms).
- **Goal**: Verify logic correctness and edge cases.
- **Standard**: Jest, Vitest, JUnit, PyTest.
- **Mocking**: Heavy use of mocks for dependencies.

### Integration Tests (The Middle)
- **Scope**: Interactions between modules (e.g., API + DB, Component + Store).
- **Speed**: Moderate.
- **Goal**: Verify that units work together correctly.
- **Mocking**: Partial (e.g., real DB, mocked 3rd party API).

### End-to-End (E2E) Tests (The Top)
- **Scope**: Full distinct user flows from UI to Backend.
- **Speed**: Slow.
- **Goal**: Verify critical business paths work for the user.
- **Standard**: Playwright, Cypress, Selenium.
- **Mocking**: Minimal to None.

## 2. Quality Gates

All projects should enforce these gates in their CI pipeline:

- [ ] **Pass Rate**: 100% of tests must pass.
- [ ] **Coverage**: Target ≥80% line/branch coverage for logic-heavy code.
- [ ] **Performance**: No regressions in key metrics (Lighthouse, Latency).
- [ ] **Security**: No known vulnerabilities in dependencies (`npm audit`).

## 3. Test Driven Development (Recommended)

1. **Red**: Write a failing test for the desired feature or bugfix.
2. **Green**: Write the minimal code to make the test pass.
3. **Refactor**: Improve the code structure while keeping tests green.

## 4. Debugging Failures

When a test fails in CI:

1. **Local Reproduction**: Run only the failing test locally.
2. **Logs**: Check CI artifacts/logs for stack traces.
3. **Environment**: Verify environment variables match CI.
4. **Bisect**: Use `git bisect` if the cause is unclear.

## 5. Maintenance

- **Flaky Tests**: Quarantine or fix immediately. Never ignore.
- **Snapshots**: Update mainly on intentional UI changes, review diffs carefully.
- **Speed**: Parallelize long-running test suites.
