# Production Operations Runbook Template

```markdown
# 🚨 Production Operations Runbook (RUNBOOK.md)

This document provides operational instructions, incident recovery procedures, health verification checks, and emergency rollback protocols for the application.

---

## 1. System Health Verification

### Quick Health Check
Run a curl probe against the production health endpoint:
```bash
curl -i https://[your-production-domain]/api/health
```
**Expected Response (HTTP 200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-09-03T18:00:00Z",
  "version": "1.0.0"
}
```

### Observability Dashboards
- **Error Tracking**: [Sentry Dashboard Link](https://sentry.io/)
- **Hosting / Deployments**: [Vercel / Netlify / Cloud Dashboard Link]()
- **Database Status**: [Supabase / Neon / AWS RDS Dashboard Link]()
- **Uptime Monitor**: [UptimeRobot / Better Uptime Link]()

---

## 2. Emergency Incident Response (Severity 1: Outage)

Follow these steps immediately if the service is down or returning widespread 500 errors:

### Step 1: Triage & Identify Scope
1. Check Sentry for new error spikes or unhandled exceptions.
2. Check hosting platform logs (e.g. Vercel Functions runtime logs or Docker container logs: `docker logs --tail 100 app`).
3. Confirm whether the database is responsive or hitting connection pool limits.

### Step 2: Instant Rollback Procedure

#### Vercel / Netlify:
1. Open deployment platform dashboard.
2. Navigate to **Deployments**.
3. Locate the previous known-good deployment.
4. Click **Instant Rollback** / **Promote to Production**.
*(Recovery time: < 30 seconds).*

#### Docker / Self-Hosted:
```bash
# Pull previous release image and restart
docker-compose down
docker pull [image-name]:[previous-stable-tag]
docker-compose up -d
```

#### Git Rollback:
```bash
git checkout main
git revert HEAD -m "revert: rollback failed deployment"
git push origin main
```

---

## 3. Database Maintenance & Disaster Recovery

### Backup Policy
- Automated daily snapshots configured via [Supabase / AWS RDS / Provider].
- Retention period: 30 days.

### Database Restoration Procedure
1. Freeze application writes by putting app in maintenance mode (if applicable).
2. Restore snapshot from provider dashboard or CLI:
   ```bash
   # Local / Postgres dump restore:
   pg_restore -h [host] -U [user] -d [dbname] [backup_file.dump]
   ```
3. Re-run migrations to verify schema alignment:
   ```bash
   npx prisma migrate status
   ```

---

## 4. Secret & Credential Rotation

If API keys or credentials are leaked or compromised:
1. **Revoke immediately** on the provider dashboard (Stripe, Resend, Supabase, OpenAI).
2. **Generate new secret key**.
3. **Update production environment variables** in deployment platform dashboard.
4. **Trigger a zero-downtime redeploy** to ensure new runtime workers pick up the updated keys.
5. **Verify health endpoint** after restart.

---

## 5. Contact & Escalation

- **Lead Engineer / Solo Owner**: [Your Name / Email / Phone]
- **Hosting Support**: [Provider support link]
- **DNS / Registrar**: [Cloudflare / Namecheap link]
```
