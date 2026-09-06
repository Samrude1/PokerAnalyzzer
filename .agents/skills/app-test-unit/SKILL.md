---
name: app-test-unit
description: >-
  Sets up, writes, and runs automated unit, integration, and API tests for fullstack web applications.
  Use this skill whenever the user asks for unit tests, test setup, Vitest/Jest configuration,
  API endpoint testing, or runs /test-unit or /unit-test.
---

# App Unit & Integration Testing Skill

This skill guides the agent in architecting, configuring, and executing automated unit and integration tests for fullstack applications. In solo development, unit tests provide an essential automated regression safety net to ensure refactorings and AI code generations don't break business logic or API contracts.

---

## Testing Hierarchy & Strategy

1. **Unit Tests**:
   - Pure utility functions (`src/lib/utils/`)
   - Zod validation schemas (`src/lib/schemas/`)
   - Custom state hooks & stores
   - Isolated service methods (`src/services/`)
2. **API & Integration Tests**:
   - API route handlers and endpoints (`/api/...`)
   - Standard envelope validation (`{ success, data, error }`)
   - Database queries & ORM model methods (with test DB / mock DB)
   - Authentication and authorization guards (valid token, missing token, unauthorized role)

---

## Workflow Steps

### Step 1: Framework Selection & Setup
Identify project framework and install appropriate test runner:

1. **Vite / Next.js (Modern / Preferred)**: **Vitest**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
   ```
   Create `vitest.config.ts`:
   ```typescript
   import { defineConfig } from 'vitest/config';
   import path from 'path';

   export default defineConfig({
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: './tests/setup.ts',
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html'],
         lines: 70,
         functions: 70,
         branches: 70,
         statements: 70,
       },
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   });
   ```

2. **Alternative (Jest)**:
   ```bash
   npm install -D jest ts-jest @types/jest
   ```

3. **Add NPM Scripts to `package.json`**:
   ```json
   "scripts": {
     "test": "vitest run",
     "test:watch": "vitest",
     "test:coverage": "vitest run --coverage"
   }
   ```

---

### Step 2: Test File Conventions & Setup
1. **Co-location vs Centralized**:
   - Unit tests: Co-located with code (`*.test.ts` / `*.spec.ts`) or in `tests/unit/`.
   - API & Integration tests: Located in `tests/api/` or `tests/integration/`.
2. **Test Setup File** (`tests/setup.ts`):
   - Import `@testing-library/jest-dom`.
   - Setup global mocks (e.g. `fetch`, environment variables).
   - Reset database mocks or test states between test cases (`afterEach`).

---

### Step 3: Writing High-Impact Unit Tests

#### A. Zod Schema & Validation Tests
```typescript
import { describe, it, expect } from 'vitest';
import { CreateUserSchema } from '@/lib/schemas/user';

describe('CreateUserSchema', () => {
  it('should accept valid user input', () => {
    const validData = { email: 'dev@example.com', name: 'Solo Dev', role: 'USER' };
    const result = CreateUserSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email format', () => {
    const invalidData = { email: 'not-an-email', name: 'Solo Dev' };
    const result = CreateUserSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

#### B. API Integration Tests (Mocking or Supertest)
```typescript
import { describe, it, expect } from 'vitest';

describe('POST /api/v1/auth/login', () => {
  it('returns 400 when body is missing required fields', async () => {
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const json = await response.json();
    
    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

### Step 4: Verification & Quality Gate
1. Execute the test suite:
   ```bash
   npm test
   ```
2. Verify test output:
   - Ensure 0 failed tests.
   - Run coverage audit: `npm run test:coverage`.
3. If tests fail:
   - Fix the underlying logic or update tests to match verified contract changes.
4. Update `.agents/blueprint/CODE_REVIEW.md`:
   - Fill in or update the **Test Coverage** metric score.
5. Update `.agents/blueprint/PROJECT_STATUS.md`:
   - Mark covered features with verified test status.

---

### Step 5: Test Execution Report
Deliver a concise completion summary:
```markdown
## 🧪 Unit & Integration Test Suite Complete

- **Test Runner**: [Vitest / Jest]
- **Tests Executed**: [Count] passed, 0 failed
- **Coverage Summary**: [e.g. Statements: 82%, Branches: 75%]
- **Modules Tested**:
  - `src/lib/schemas/...` (Zod validation)
  - `src/services/...` (Domain logic)
  - `src/api/...` (API endpoints)
```

---

## Error Handling & Fallbacks

If any step in this testing workflow fails:
1. **Module Resolution Errors**: Verify `tsconfig.json` paths match the test runner configuration aliases (e.g. `@/*` -> `./src/*`).
2. **Environment Mismatches**: If DOM APIs (`window`, `localStorage`) fail in tests, ensure `environment: 'jsdom'` or `happy-dom` is configured.
3. **Async / Timeout Failures**: Increase test timeouts for database or network mocks (`{ timeout: 10000 }`).
4. **Escalate**: If root cause is unclear after 2 attempts, present the failing test snippet and error trace to the developer.
