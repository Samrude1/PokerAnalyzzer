---
name: app-init
description: >-
  Initializes a new fullstack web application project. Use this skill whenever the user
  requests to start a new project, runs /init, or asks to scaffold an application.
  Includes an interactive 6-question Grill-Me interview and complete project scaffolding.
---

# App Init Skill

This skill guides the initialization and scaffolding of a new fullstack web application project. It ensures a clear Product Requirements Document (PRD) and architecture blueprint are locked in before code generation begins, adhering to strict quality and security standards.

---

## Workflow Steps

### Step 1: Initial Concept Check
Inspect if a project description or requirements already exist in the project or prompt:
1. Look for: `docs/PRD.md`, `requirements.md`, `README.md`, or pitch notes.
2. If the user provided a detailed concept, proceed directly to **Step 3**.
3. If the concept is missing or ambiguous, proceed to **Step 2 (Grill-Me)**.

---

### Step 2: Grill-Me Interview (If Needed)
Do not guess requirements. Enter interactive interview mode and present 6 focused questions:

1. **App Type & Core Purpose**:
   - *What kind of application is this? (e.g., SaaS dashboard, e-commerce store, portfolio site, blog/CMS, internal tool, social platform?)*
2. **Tech Stack Preferences**:
   - *What tech stack do you prefer? (e.g., Next.js, Vite+React, SvelteKit, Astro, Express+EJS?) Any database preference? (PostgreSQL, SQLite, MongoDB, Supabase?)*
3. **Data & Authentication**:
   - *What data does the app manage and how do users authenticate? (e.g., email/password, OAuth/Google, magic links, no auth needed?) API style: REST, GraphQL, tRPC?*
4. **Design Style & Target**:
   - *What is the visual style? (e.g., Modern minimal, glassmorphism, dark mode, corporate clean, playful/colorful?) Desktop-first or mobile-first?*
5. **Deployment & Hosting Strategy**:
   - *Where will this be deployed? (e.g., Vercel, Netlify, Docker container, Railway, Fly.io?) Do you want an automated GitHub Actions CI/CD pipeline right away?*
6. **Integrations & Third-Party Services**:
   - *Do you anticipate external integrations? (e.g., Stripe payments, Resend/SendGrid emails, AI/LLM models, S3/Cloudflare file storage, analytics)?*

*Wait for user response before generating code.*

---

### Step 3: Generate Blueprint & PRD (.agents/blueprint/)
Once the concept is aligned:
1. Create or update `.agents/blueprint/PRD.md` (Product Requirements Document, features, user stories).
   - Use [resources/docs/PRD_TEMPLATE.md](./resources/docs/PRD_TEMPLATE.md) as the base template.
2. Create or update `.agents/blueprint/ARCHITECTURE.md` (technical architecture, file layout, data flow).
3. Create or update `.agents/blueprint/STYLE_GUIDE.md` (design tokens, color palette, typography for chosen theme).
4. Create or update `.agents/blueprint/PROJECT_STATUS.md` (status, feature matrix, roadmap).

---

### Step 4: Scaffold the Application
Use the appropriate scaffolding tool based on the chosen stack:

1. **Next.js**: `npx -y create-next-app@latest ./ --ts --eslint --app --src-dir --import-alias "@/*" --no-tailwind`
2. **Vite + React**: `npx -y create-vite@latest ./ -- --template react-ts`
3. **SvelteKit**: `npx -y sv create ./`
4. **Astro**: `npx -y create-astro@latest ./`
5. **Express**: Manual scaffold with `npm init -y` and core dependencies.

After scaffolding:
- Install dependencies (`npm install`).
- Apply design tokens from `STYLE_GUIDE.md` to the global CSS.
- Set up initial page structure per `ARCHITECTURE.md`.
- Configure `.env.example` with required environment variable templates.

---

### Step 5: Verification and Launch
1. Run `npm run dev` and ensure the app starts without console errors.
2. Verify the landing page renders correctly in the browser.
3. Give the developer a concise kick-off summary and propose the first feature sprint.

---

## Error Handling & Fallbacks

If any step in this scaffolding workflow fails:
1. **Directory Collision**: If `create-next-app` or `create-vite` refuses to write to a non-empty directory, scaffold into a temporary folder and move code files over, preserving `.agents/`.
2. **Dependency Installation Error**: Run `npm cache clean --force` and retry `npm install`.
3. **Template Drift**: Ensure newly generated project files respect the CSS tokens in `STYLE_GUIDE.md` rather than framework boilerplate styles.
4. **Escalate**: If package manager issues persist, notify developer with the exact installation logs.
