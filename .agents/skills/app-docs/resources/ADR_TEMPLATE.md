# Architectural Decision Record (ADR) Template (MADR Format)

```markdown
# [Short title of solved problem and decision]

- **Status**: [proposed | accepted | superseded | deprecated]
- **Deciders**: [Developer / Team]
- **Date**: YYYY-MM-DD

---

## Context and Problem Statement

[What is the context of this decision? What problem are we solving? State the issue clearly, including technical, product, or organizational drivers.]

---

## Decision Drivers

- [Driver 1, e.g. Solo developer velocity and low operational maintenance]
- [Driver 2, e.g. Strict type safety between database and frontend]
- [Driver 3, e.g. Zero-cost tier for initial launch]

---

## Considered Options

1. **[Option 1]** (e.g. Next.js App Router + Prisma + PostgreSQL)
2. **[Option 2]** (e.g. Vite SPA + Express API + MongoDB)
3. **[Option 3]** (e.g. Remix + Drizzle + SQLite)

---

## Decision Outcome

Chosen option: **[Option 1]**, because [justification of why this option best addresses the drivers with acceptable trade-offs].

### Positive Consequences
- [Positive consequence 1, e.g. Shared TypeScript types between frontend and API]
- [Positive consequence 2, e.g. Out-of-the-box streaming and server-side rendering]

### Negative Consequences / Trade-offs
- [Negative consequence 1, e.g. Vendor lock-in considerations]
- [Mitigation strategy for negative consequences]

---

## Pros and Cons of the Options

### [Option 1]
- Good, because [argument a]
- Good, because [argument b]
- Bad, because [argument c]

### [Option 2]
- Good, because [argument a]
- Bad, because [argument b]
```
