---
name: app-db
description: >-
  Designs, generates, and migrates database schemas, models, indexes, and seed data.
  Use this skill whenever the user requests database setup, schema changes, ORM models,
  migrations, seed data, or runs /db or /database.
---

# App Database & Schema Engineering Skill

This skill guides the agent in building robust, high-performance database architectures for fullstack applications. It prevents data layer drift, ensures proper relations and indexing, and keeps migrations synchronized with `.agents/blueprint/ARCHITECTURE.md`.

---

## Database Engineering Workflow

### Step 1: Requirements & Data Modeling
1. Identify entities, relationships (1:1, 1:N, N:M), and data types from `.agents/blueprint/PRD.md` or user request.
2. Determine ORM / database technology:
   - **Prisma**: `prisma/schema.prisma`
   - **Drizzle**: `src/db/schema.ts`
   - **Supabase / SQL**: `supabase/migrations/` or raw migration scripts
   - **Mongoose**: `src/models/`
3. Apply standard audit fields to all major entities:
   - `id` (UUIDv4 or auto-incrementing ID)
   - `createdAt` (timestamp with timezone, default now)
   - `updatedAt` (timestamp with timezone, auto-updated)
   - `deletedAt` (nullable timestamp for soft deletes, if required)

---

### Step 2: Indexing & Performance Rules
1. **Foreign Keys**: Every relation foreign key column MUST have an index.
2. **Search & Filter**: Columns frequently filtered or sorted (e.g. `userId`, `status`, `email`, `slug`) MUST be indexed.
3. **Uniqueness**: Enforce unique constraints at the database level (`@unique`), not just in application code.
4. **Cascading Rules**: Explicitly define `onDelete` behaviors (`Cascade`, `SetNull`, `Restrict`).

---

### Step 3: Schema Generation & Migration
1. Write or update the schema file following strict formatting and comments.
2. Generate migration:
   - Prisma: `npx prisma migrate dev --name <migration_name>`
   - Drizzle: `npx drizzle-kit generate` & `npx drizzle-kit migrate`
3. Generate typed client (`npx prisma generate`).
4. Ensure migration applies cleanly with zero data-loss warnings unless explicitly confirmed.

---

### Step 4: Seed Data Fixtures
1. Create or update seed script (`prisma/seed.ts` or `src/db/seed.ts`).
2. Provide deterministic, realistic sample data for local development (sample users, items, categories).
3. Ensure seed script is idempotent (can run multiple times without duplicate key errors).

---

### Step 5: Blueprint & Documentation Sync
1. Update `.agents/blueprint/ARCHITECTURE.md` with the new data model and entity relationships.
2. If new features are unblocked, update `.agents/blueprint/PROJECT_STATUS.md`.

---

### Step 6: Completion Report
Provide a clean summary:
```markdown
## 🗄️ Database Schema & Migration Complete

- **ORM / Provider**: [Prisma / Drizzle / Supabase]
- **Modified Entities**: [List of models]
- **Migration**: [Migration name / file]
- **Indexes Added**: [List of indexed columns]
- **Seed Script**: [Status of seed data]

Next recommended step: Generate API routes with `/api [entity]`.
```

---

## Error Handling & Fallbacks

If database migrations or schema synchronization fail:
1. **Migration Drift / Lock Conflict**: Never use `--force` in production. For local development drift, inspect pending migrations, create a backup, or run reset if safe.
2. **Missing Environment Variables**: Verify `DATABASE_URL` is configured in local `.env` and connection string includes necessary pooling/SSL flags (e.g. `?sslmode=require`).
3. **Data Loss Warnings**: Stop immediately if an ORM reports destructive column drops. Confirm with developer before applying irreversible schema alterations.
4. **Escalate**: If database constraints prevent seeds from executing, examine foreign key order and resolve cyclic dependencies.

