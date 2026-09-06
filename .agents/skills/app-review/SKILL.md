---
name: app-review
description: >-
  Audits and optimizes fullstack web application code quality. Use this skill whenever
  the user requests a code review, quality check, optimization, architecture audit,
  or runs /review or /optimize.
---

# App Code Review & Quality Audit Skill

This skill guides the agent in conducting an in-depth code quality, architecture, security, and performance audit for a fullstack web application. It is designed for post-sprint quality gates and multi-session validation.

---

## Audit Checklist

### 1. Performance (Core Web Vitals)
- **Bundle Size**: Are there unnecessarily large dependencies? Can any be replaced or tree-shaken?
- **Lazy Loading**: Are heavy components and routes dynamically imported?
- **Image Optimization**: Are images served in modern formats (WebP/AVIF) with appropriate dimensions?
- **Render Blocking**: Are CSS and JS resources optimized to avoid blocking first paint?
- **Caching**: Are static assets cached properly? Is SWR/stale-while-revalidate used for data fetching?
- **DOM Thrashing**: Are layout recalculations minimized? No `getBoundingClientRect` in tight loops.

### 2. Security (OWASP Top 10)
- **Secrets Exposure**: Scan for hardcoded API keys, passwords, or tokens in source code.
- **Input Validation**: Are all API endpoints validating and sanitizing inputs?
- **SQL Injection**: Are all database queries parameterized? No string concatenation in queries.
- **XSS Prevention**: Is user-generated content sanitized before rendering?
- **CORS Configuration**: Is `Access-Control-Allow-Origin` restricted to specific origins?
- **Authentication**: Are auth tokens properly secured (httpOnly cookies, short expiry)?
- **Authorization**: Do API endpoints enforce proper access control?

### 3. Accessibility (WCAG 2.1 AA)
- **Semantic HTML**: Are `<header>`, `<main>`, `<nav>`, `<section>`, `<article>` used correctly?
- **Keyboard Navigation**: Can all interactive elements be reached and activated via keyboard?
- **Focus Management**: Are focus styles visible? Is focus properly managed in modals and dynamic content?
- **Alt Text**: Do all images have meaningful `alt` attributes?
- **Color Contrast**: Do text/background combinations meet 4.5:1 ratio for normal text?
- **ARIA**: Are ARIA attributes used correctly and only where semantic HTML is insufficient?

### 4. SEO
- **Meta Tags**: Does every page have a unique `<title>` and `<meta name="description">`?
- **Heading Hierarchy**: Is there a single `<h1>` per page with proper `<h2>`→`<h6>` nesting?
- **OpenGraph**: Are `og:title`, `og:description`, `og:image` defined for social sharing?
- **Structured Data**: Is JSON-LD schema markup present where appropriate?

### 5. Architecture & Decoupling
- **Single Responsibility**: Is any file overly monolithic (>300–400 lines) mixing UI, data fetching, and business logic?
- **Component Isolation**: Are components reusable and composable?
- **API Layer Separation**: Is business logic separated from route handlers?
- **Type Safety**: Is TypeScript used consistently with strict mode? Are `any` types avoided?
- **Global State**: Is state management minimal and well-scoped?

### 6. Code Quality & Style Compliance
- **Linting**: Does `npm run lint` pass with zero warnings?
- **Naming Conventions**: Components (PascalCase), utilities (camelCase), constants (UPPER_SNAKE_CASE)?
- **Magic Numbers**: Are literal values extracted into named constants?
- **Documentation**: Are complex business logic and non-obvious code paths documented?
- **Style Drift**: Compare UI elements against `.agents/blueprint/STYLE_GUIDE.md`:
  - Are all buttons styled with standard classes (`.btn-primary`, `.btn-secondary`)?
  - Are colors referencing CSS variables instead of hardcoded hex?
  - Is spacing consistent using the `--space-*` scale?

### 7. Test Coverage
- **Unit Tests**: Are critical business logic functions covered?
- **Integration Tests**: Are API endpoints tested with valid and invalid inputs?
- **E2E Tests**: Are critical user flows (auth, main features) covered?

---

## Deliverables

1. Update `.agents/blueprint/CODE_REVIEW.md` with grades (A–F), critical findings, and before/after refactoring snippets.
2. Update `.agents/blueprint/PROJECT_STATUS.md` technical debt section.
3. Present an Executive Summary to the developer with actionable proposals.

---

## Error Handling & Fallbacks

If code review diagnostics or linters encounter errors:
1. **ESLint / TypeScript Config Incompatibility**: Run `npx eslint --debug` or inspect `tsconfig.json` compiler options.
2. **Review Ambiguity**: If code quality tradeoffs exist (e.g. bundle size vs developer ergonomics), document pros and cons explicitly in `CODE_REVIEW.md` rather than dictating single choices.
3. **Escalate**: When critical performance or accessibility debt is identified, flag it prominently in the executive debrief with an immediate offer to execute the fix.

