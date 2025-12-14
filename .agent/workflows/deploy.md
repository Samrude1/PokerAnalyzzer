---
description: Deployment process for staging and production environments
---

# Deployment Workflow

This workflow covers deploying applications to staging and production environments.

## Pre-deployment Checklist

Before deploying, ensure:
- [ ] All tests pass (unit, integration, e2e)
- [ ] Code review approved
- [ ] Quality gates met (Lighthouse ≥ 90, coverage ≥ 80%)
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] CHANGELOG.md updated
- [ ] Version bumped (SemVer)
- [ ] Release notes prepared
- [ ] Rollback plan documented

## Environments

### Development
- **URL**: http://localhost:3000
- **Purpose**: Local development and testing
- **Auto-deploy**: No

### Staging
- **URL**: https://staging.example.com
- **Purpose**: Pre-production testing and validation
- **Auto-deploy**: Yes (on merge to `develop` branch)

### Production
- **URL**: https://example.com
- **Purpose**: Live user-facing application
- **Auto-deploy**: No (manual approval required)

## Deployment Steps

### 1. Prepare Release

Create release branch:
```bash
git checkout -b release/v1.2.3
```

Update version:
```bash
npm version minor -m "chore: bump version to %s"
```

Update CHANGELOG.md with release notes

### 2. Run Pre-deployment Tests

// turbo-all
```bash
# Run full test suite
npm run test:all

# Run security audit
npm audit --production

# Run performance tests
npm run lighthouse

# Build production bundle
npm run build

# Analyze bundle size
npm run build:analyze
```

### 3. Deploy to Staging

Merge to develop branch:
```bash
git checkout develop
git merge release/v1.2.3
git push origin develop
```

Wait for CI/CD pipeline to complete

### 4. Smoke Test Staging

// turbo
```bash
npm run test:smoke:staging
```

Manual verification:
- [ ] Critical user flows work
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Accessibility features work

### 5. Deploy to Production

Create production release:
```bash
git checkout main
git merge release/v1.2.3
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin main --tags
```

Trigger production deployment (manual approval in CI/CD)

### 6. Monitor Deployment

Watch deployment progress:
- Check CI/CD pipeline status
- Monitor application logs
- Watch error tracking dashboard
- Review performance metrics

### 7. Post-deployment Validation

// turbo
```bash
npm run test:smoke:production
```

Verify:
- [ ] Application accessible
- [ ] Health check endpoints responding
- [ ] No error spikes in monitoring
- [ ] Performance metrics normal
- [ ] Database migrations successful (if any)

### 8. Announce Release

- Update status page
- Notify team in Slack/Teams
- Send release notes to stakeholders
- Update documentation site

## Rollback Procedure

If issues are detected after deployment:

### 1. Assess Severity
- **Critical**: Immediate rollback required
- **High**: Rollback within 1 hour
- **Medium**: Fix forward or rollback within 24 hours

### 2. Execute Rollback

Revert to previous version:
```bash
# Identify previous stable version
git tag -l

# Deploy previous version
git checkout v1.2.2
git push origin main --force
```

Or use platform-specific rollback:
```bash
# Kubernetes
kubectl rollout undo deployment/app-name

# Vercel/Netlify
# Use dashboard to rollback to previous deployment
```

### 3. Post-rollback Actions
- Verify application stability
- Run smoke tests
- Document incident
- Create postmortem
- Plan fix and re-deployment

## Canary Deployment (Advanced)

For zero-downtime deployments:

### 1. Deploy Canary
```bash
# Deploy to 10% of traffic
kubectl set image deployment/app app=app:v1.2.3 --canary
```

### 2. Monitor Canary
- Watch error rates
- Compare performance metrics
- Check user feedback

### 3. Promote or Rollback
```bash
# If successful, promote to 100%
kubectl set image deployment/app app=app:v1.2.3

# If issues, rollback canary
kubectl rollout undo deployment/app
```

## Environment Variables

### Managing Secrets

**Never commit secrets to repository**

Use environment-specific configuration:

```bash
# Development (.env.local)
DATABASE_URL=postgresql://localhost:5432/dev

# Staging (CI/CD secrets)
DATABASE_URL=postgresql://staging-db:5432/staging

# Production (Kubernetes secrets / Vault)
DATABASE_URL=postgresql://prod-db:5432/production
```

### Updating Secrets

1. Update in secret management system (Vault, AWS Secrets Manager)
2. Restart application to pick up new values
3. Verify application functionality

## Database Migrations

### Pre-deployment
```bash
# Test migrations locally
npm run migrate:test

# Backup production database
npm run db:backup:production
```

### During deployment
```bash
# Run migrations
npm run migrate:production

# Verify migration success
npm run migrate:status
```

### Rollback migrations (if needed)
```bash
npm run migrate:rollback
```

## Performance Monitoring

After deployment, monitor:
- **Response times**: Should remain stable
- **Error rates**: Should not increase
- **CPU/Memory usage**: Should be within normal range
- **Database query performance**: No new slow queries

## Security Checks

Post-deployment security validation:
- [ ] Security headers present
- [ ] HTTPS enforced
- [ ] CSP policy active
- [ ] No exposed secrets in client bundle
- [ ] Authentication working
- [ ] Rate limiting active

## Deployment Frequency

**Target**: ≥ 1 deployment per week

**Metrics to track**:
- Deployment frequency
- Lead time for changes
- Mean time to recovery (MTTR)
- Change failure rate

## Troubleshooting

### Deployment Fails
1. Check CI/CD logs
2. Verify environment variables
3. Check resource limits (CPU/memory)
4. Review recent code changes

### Application Won't Start
1. Check application logs
2. Verify database connectivity
3. Check environment configuration
4. Review health check endpoints

### Performance Degradation
1. Check resource utilization
2. Review database query performance
3. Analyze bundle size changes
4. Check external API response times

## Success Criteria

Deployment is successful when:
- ✅ Application accessible and responsive
- ✅ All smoke tests pass
- ✅ No error spikes in monitoring
- ✅ Performance metrics within acceptable range
- ✅ Health checks passing
- ✅ No rollback required within 24 hours

## Next Steps

After successful deployment:
1. Monitor application for 24-48 hours
2. Review deployment metrics
3. Update deployment documentation if needed
4. Plan next sprint features
