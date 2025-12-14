---
description: Universal deployment and release strategy
---

# Universal Deployment Workflow

This workflow covers the standard process for safe, reliable releases across any platform (Web, Mobile, API).

## 1. Release Strategy

### Versioning
- **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`
  - `MAJOR`: Breaking changes.
  - `MINOR`: New features (backward compatible).
  - `PATCH`: Bug fixes.

### Environments
- **Local**: Developer machine.
- **Staging**: Mirror of production for final testing.
- **Production**: Live environment for end-users.

## 2. Pre-Deployment Checklist

Before triggering a release:
- [ ] **Tests**: All green in CI.
- [ ] **Lint/Audit**: No issues.
- [ ] **Changelog**: Updated with new changes.
- [ ] **Data Migration**: Database scripts tested (if applicable).
- [ ] **Rollback Plan**: "If this fails, how do I undo it?"

## 3. The Deployment Pipeline

Ideally automated via CI/CD (GitHub Actions, GitLab CI):

1. **Build Artifact**: Create a Docker image, binary, or static bundle.
2. **Smoke Test (Staging)**: Deploy artifact to staging. Run critical path tests.
3. **Approval**: Manual or automated gate.
4. **Promote (Production)**: Deploy the *exact same artifact* to production.
   - *Why?* Rebuilding for prod introduces risk of difference.

## 4. Post-Deployment Verification

- **Health Check**: Hit `/healthz` or status endpoint.
- **Error Monitoring**: Check Sentry/Datadog for error spikes.
- **Performance**: Verify response times are stable.

## 5. Rollback Procedure

If something goes wrong:
1. **Detect**: Alerts trigger or users report issues.
2. **Revert**: Immediately deploy the *previous* stable artifact.
   - *Do not try to fix-forward* unless the fix is trivial and low-risk.
3. **Analyze**: Conduct a post-mortem to prevent recurrence.

## 6. Secrets Management

- **Rule**: NEVER commit API keys or passwords.
- **Development**: Use `.env` files (gitignored).
- **Production**: Inject via platform secrets (Kubernetes Secrets, AWS Parameter Store, etc.).
