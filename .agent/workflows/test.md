---
description: Running tests and ensuring quality standards
---

# Testing Workflow

This workflow covers running all types of tests and ensuring quality gates are met.

## Test Types

### 1. Unit Tests

Run unit tests for specific modules:

// turbo
```bash
npm run test:unit
```

Run with coverage:
```bash
npm run test:unit -- --coverage
```

**Quality Gate**: Coverage ≥ 80% for critical modules

### 2. Integration Tests

Run integration tests:

// turbo
```bash
npm run test:integration
```

**Scope**: API endpoints, database interactions, external service mocks

### 3. End-to-End Tests

Run e2e tests for web:
```bash
npm run test:e2e:web
```

Run e2e tests for mobile:
```bash
npm run test:e2e:mobile
```

**Quality Gate**: Pass rate ≥ 95% for critical paths

### 4. Visual Regression Tests

Run visual tests (if configured):
```bash
npm run test:visual
```

## Test Execution Strategies

### Quick Check (Pre-commit)
// turbo-all
```bash
# Run tests only for changed files
npm run test:changed

# Run linting
npm run lint

# Format check
npm run format:check
```

### Full Suite (Pre-merge)
```bash
# Run all tests
npm run test:all

# Run security scan
npm audit

# Check bundle size
npm run build:analyze
```

### Pre-deployment Validation
```bash
# Run smoke tests
npm run test:smoke

# Run performance tests
npm run test:performance

# Validate accessibility
npm run test:a11y
```

## Debugging Failed Tests

### 1. Identify Failing Tests
```bash
npm run test -- --verbose
```

### 2. Run Single Test File
```bash
npm run test -- path/to/test.spec.js
```

### 3. Run in Watch Mode
```bash
npm run test:watch
```

### 4. Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Coverage Reports

### Generate Coverage Report
// turbo
```bash
npm run test:coverage
```

### View Coverage Report
Open `coverage/lcov-report/index.html` in browser

### Coverage Thresholds
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## Performance Testing

### Web Performance (Lighthouse)
```bash
npm run lighthouse
```

**Target**: All scores ≥ 90

### Mobile Performance
```bash
npm run test:performance:mobile
```

**Target**: Cold start ≤ 2s

## Accessibility Testing

### Automated a11y Tests
// turbo
```bash
npm run test:a11y
```

**Standard**: WCAG 2.1 Level AA compliance

### Manual Testing Checklist
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets standards
- [ ] Focus indicators visible
- [ ] Form labels present
- [ ] ARIA attributes correct

## Continuous Testing

### Watch Mode for Development
```bash
npm run test:watch
```

### CI Pipeline Tests
Tests run automatically on:
- Every commit (unit tests + lint)
- Pull requests (full suite)
- Pre-deployment (smoke + e2e)

## Test Maintenance

### Update Snapshots
```bash
npm run test:update-snapshots
```

### Clean Test Cache
```bash
npm run test:clear-cache
```

### Fix Flaky Tests
1. Identify flaky tests in CI logs
2. Add proper waits/assertions
3. Use test retries sparingly
4. Document in test file if unavoidable

## Quality Gates Summary

Before merging code, ensure:
- ✅ All unit tests pass
- ✅ Coverage ≥ 80%
- ✅ Integration tests pass
- ✅ E2E critical paths pass (≥95%)
- ✅ No security vulnerabilities
- ✅ Lighthouse score ≥ 90 (web)
- ✅ No accessibility violations
- ✅ Bundle size within limits

## Troubleshooting

### Tests Timing Out
- Increase timeout in test configuration
- Check for unresolved promises
- Ensure proper cleanup in afterEach

### Flaky Tests
- Add explicit waits
- Mock time-dependent code
- Isolate test data

### Memory Leaks
- Run with `--detectLeaks`
- Check for unclosed connections
- Review event listener cleanup

## Next Steps

After all tests pass:
1. Review coverage report
2. Address any gaps in testing
3. Update test documentation
4. Proceed with deployment workflow
