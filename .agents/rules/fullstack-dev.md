# Fullstack Web Application Development Rules & Standards

These rules govern all application development and code generation in this repository. Any AI agent or developer must adhere to these principles when writing, refactoring, or optimizing code.

---

## 1. Architecture & Technology Stack
- **Approach**: Framework-agnostic. Use the stack defined in `.agents/blueprint/PRD.md` and `.agents/blueprint/ARCHITECTURE.md`.
- **Modularity**: Organize code into clear, single-responsibility modules:
  - `src/components/` (Reusable UI components)
  - `src/app/` or `src/pages/` (Page routes and layouts)
  - `src/lib/` (Shared utilities, helpers, configuration)
  - `src/services/` (Business logic and external integrations)
  - `src/api/` or `src/server/` (Backend API routes and middleware)
  - `src/db/` (Database schema, migrations, seeds)
- **Dependencies**: Prefer well-maintained, minimal libraries. Avoid bloated frameworks or unnecessary packages. Document every new dependency with justification.

---

## 2. Frontend Standards
- **Responsive Design**: Mobile-first approach. All pages must work across mobile (320px+), tablet, and desktop.
- **Semantic HTML**: Use `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<aside>`, `<footer>` appropriately.
- **Accessibility (WCAG 2.1 AA)**:
  - All interactive elements must be keyboard accessible.
  - Images require meaningful `alt` text.
  - Form inputs must have associated `<label>` elements.
  - Color contrast ratios must meet AA standards (4.5:1 for normal text).
  - ARIA attributes where semantic HTML is insufficient.
- **Component Design**: Reusable, composable, and stateless where possible. Each component has a single responsibility.

---

## 3. CSS & Styling
- **Design Tokens**: All colors, spacing, radii, and shadows must use CSS custom properties defined in `STYLE_GUIDE.md`.
  ```css
  /* ✅ Correct */
  color: var(--text-primary);
  padding: var(--space-md);
  
  /* ❌ Incorrect */
  color: #f8fafc;
  padding: 16px;
  ```
- **No Inline Styles**: Never use `style="..."` attributes or `element.style.x = ...` in JavaScript.
- **No Ad-Hoc Classes**: All button, card, input, and modal styles must follow the component library in `STYLE_GUIDE.md`.
- **Responsive Breakpoints**: Use the standard breakpoint scale (sm: 640px, md: 768px, lg: 1024px, xl: 1280px).

---

## 4. Backend & API Standards
- **RESTful Conventions**:
  - `GET` for reads, `POST` for creates, `PUT`/`PATCH` for updates, `DELETE` for deletions.
  - Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500).
- **Input Validation**: Validate and sanitize all user inputs on the server using Zod schemas.
- **Response Envelopes**:
  - Success responses: `{ success: true, data: { ... }, meta?: { ... } }`.
  - Error responses: `{ success: false, error: { code: string, message: string, details?: unknown[] } }`.
  - Never expose stack traces or internal errors to the client in production.
- **Database Queries**: Always use parameterized queries or ORM methods. Never concatenate user input into SQL strings.

---

## 5. Security
- **Secrets Management**: All API keys, database URLs, and credentials must be stored in `.env` files (never committed to git).
- **CORS**: Configure allowed origins explicitly. Never use `Access-Control-Allow-Origin: *` in production.
- **XSS Prevention**: Sanitize user-generated content before rendering. Use framework-provided escaping (e.g., React's JSX auto-escaping).
- **CSRF Protection**: Implement CSRF tokens for state-changing operations where applicable.
- **Authentication**: Use established auth libraries (NextAuth, Clerk, Passport). Never roll custom password hashing without `bcrypt` or `argon2`.
- **Authorization**: Enforce role-based or policy-based access control on both frontend routes and API endpoints.

---

## 6. Performance
- **Lazy Loading**: Dynamically import heavy components and routes.
- **Image Optimization**: Use `next/image`, `<picture>`, or optimized formats (WebP, AVIF) with appropriate sizing.
- **Code Splitting**: Ensure the build system splits bundles per route.
- **Caching**: Set proper `Cache-Control` headers for static assets. Use SWR/TanStack Query stale-while-revalidate patterns for data.
- **Core Web Vitals**: Monitor LCP, FID/INP, and CLS. Keep LCP < 2.5s, INP < 200ms, CLS < 0.1.

---

## 7. SEO
- **Meta Tags**: Every page must have a unique `<title>` and `<meta name="description">`.
- **Heading Hierarchy**: Single `<h1>` per page, proper `<h2>`→`<h6>` nesting.
- **OpenGraph**: Include `og:title`, `og:description`, `og:image` for social sharing.
- **Structured Data**: Add JSON-LD schema markup where appropriate.

---

## 8. Code Quality
- **TypeScript**: Encouraged for all new code. Use strict mode and avoid `any`.
- **Linting**: ESLint with framework-appropriate config. No warnings in clean builds.
- **Naming Conventions**:
  - Components: PascalCase (`UserProfile.tsx`)
  - Utilities/hooks: camelCase (`useAuth.ts`, `formatDate.ts`)
  - Constants: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
  - CSS classes: kebab-case (`.btn-primary`, `.card-header`)
- **No Magic Strings or Numbers**: Extract to named constants or environment variables.
- **Documentation**: JSDoc/TSDoc for public APIs, complex business logic, and non-obvious code paths.

---

## 9. Testing Standards
- **Unit Tests**: Critical business logic, Zod schemas, data transformers, and utility functions must have unit tests.
- **API Tests**: All API endpoints must have integration tests covering success, validation error (400), and auth failure (401/403) cases.
- **Coverage**: Maintain minimum 70% statement coverage on service, utility, and schema modules.
- **Test Naming**: Use descriptive test names: `it('should return 401 when auth token is missing')`.
- **Test Isolation**: Co-locate unit tests (`*.test.ts`) with source code, or place integration suites in `tests/`. Reset state/mocks after each test.

---

## 10. Git & Version Control
- **Commit Convention**: Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`).
- **Branch Strategy**:
  - `main`: Production-stable branch.
  - `dev`: Active integration/staging branch.
  - `feat/<name>` / `fix/<name>`: Feature and bugfix branches.
- **Versioning**: Follow Semantic Versioning (`MAJOR.MINOR.PATCH`).
- **Releases & Tags**: Tag production releases with Git tags (`git tag -a v1.0.0 -m "Release v1.0.0"`).
- **Changelog**: Maintain `CHANGELOG.md` with categorized entries (`Added`, `Changed`, `Fixed`, `Security`).

