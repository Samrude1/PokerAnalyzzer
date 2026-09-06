---
name: app-deploy
description: >-
  Packages and prepares the application for production deployment.
  Use this skill whenever the user wants to deploy, build for production,
  containerize, or runs /build, /deploy, or /export.
---

# App Deploy & Production Packaging Skill

This skill guides the agent in preparing and deploying a fullstack web application to production. It ensures the build is optimized, environment variables are configured, and the deployment target is properly set up.

---

## Deployment Workflow

### Step 1: Production Readiness Audit
1. **Build Verification**:
   - Run `npm run build` and verify zero errors.
   - Check for TypeScript errors: `npx tsc --noEmit`.
   - Check for linting issues: `npm run lint`.
2. **Environment Variables**:
   - Verify all required env vars are documented in `.env.example`.
   - Confirm production values are set in the deployment platform (not committed to git).
3. **Security Checklist**:
   - No hardcoded secrets in source code.
   - Debug/verbose logging disabled for production.
   - Error pages do not expose stack traces.
4. **SEO & Social Sharing**:
   - Validate `<title>`, `<meta name="description">`, and OpenGraph tags (`og:title`, `og:image`, `og:description`).
   - Verify favicon and social share images are present.

---

### Step 2: Platform-Specific Deployment

#### A. Vercel
- Verify `vercel.json` configuration (if needed).
- Ensure framework auto-detection works or configure build command and output directory.
- Set environment variables in Vercel dashboard or CLI.
- Deploy: `npx vercel --prod` or push to connected Git branch.

#### B. Netlify
- Verify `netlify.toml` configuration.
- Configure build command (`npm run build`) and publish directory (`dist/`, `.next/`, `build/`).
- Set environment variables in Netlify dashboard.
- Deploy: `npx netlify deploy --prod` or push to connected Git branch.

#### C. Docker
- Generate or verify `Dockerfile`:
  - Multi-stage build (install deps → build → production image).
  - Use slim/alpine base images.
  - Non-root user for security.
- Generate or verify `docker-compose.yml` (if database/services needed).
- Build and test: `docker build -t app . && docker run -p 3000:3000 app`.

#### D. GitHub Pages (Static Sites Only)
- Ensure the build generates static output.
- Configure base path if deploying to a subdirectory.
- Set up GitHub Actions workflow for automatic deployment.

#### E. Railway / Fly.io
- Verify platform-specific config files.
- Configure environment variables via platform CLI or dashboard.
- Deploy via CLI or Git push.

---

### Step 2.5: Production Monitoring & Observability Setup
Ensure production instrumentation is established prior to or immediately following initial deployment:

1. **Error Tracking & Crash Reporting (Sentry)**:
   - Next.js: `npx @sentry/wizard@latest -i nextjs`
   - Express / Node: `npm install @sentry/node`
   - Configure DSN via `SENTRY_DSN` environment variable.
   - Instrument both client error boundaries and server API unhandled rejections.
2. **Health Check Endpoint**:
   - Create `GET /api/health` returning JSON:
     ```json
     { "status": "ok", "timestamp": "2026-09-03T18:00:00Z", "version": "1.0.0" }
     ```
   - Validate database connectivity if a database is used (e.g. `SELECT 1`).
3. **Structured Server Logging**:
   - Prefer structured JSON logger (`pino`) over raw `console.log` for backend services.
   - Never log passwords, auth tokens, secrets, or sensitive PII.
4. **Uptime & Real-User Monitoring**:
   - Set up free monitoring ping (e.g. UptimeRobot, Better Uptime) targeting `/api/health`.

---

### Step 3: Post-Deployment Verification
1. Visit the production URL and verify:
   - Pages load correctly without console errors.
   - API endpoints respond with correct data.
   - Auth flows work in production environment.
   - Images and assets load properly.
2. Run a Lighthouse audit (performance, accessibility, SEO, best practices).

---

### Step 4: Release Report for Developer
Deliver a concise summary with deployment details, production URL, and any post-launch recommendations.

```markdown
## 🚀 Deployment Report

- **Platform**: [Vercel / Netlify / Docker / etc.]
- **URL**: [Production URL]
- **Build Status**: ✅ Clean build (0 errors, 0 warnings)
- **Lighthouse Score**: Performance [X] / A11y [X] / SEO [X] / Best Practices [X]
- **Monitoring**: Sentry [Configured / Pending], Health Check [`/api/health` active]

### Post-Launch Recommendations
- [Configure custom domain and SSL certificate]
- [Verify uptime monitoring ping on /api/health]
- [Set up CI/CD pipeline for automatic branch deployments via /ci]
```

---

## Error Handling & Fallbacks

If any step in this deployment workflow fails:
1. **Build Step Errors**: Run `npx tsc --noEmit` locally to catch type inconsistencies and verify `package.json` build scripts.
2. **Missing Environment Variables**: Compare production platform dashboard variables with `.env.example`.
3. **Container Failures (Docker)**: Test the container locally (`docker run --rm -p 3000:3000 app`) before pushing to remote registries.
4. **Escalate**: If deployment fails due to platform quota or DNS propagation delays, clearly present the error log and configuration check to the developer.
