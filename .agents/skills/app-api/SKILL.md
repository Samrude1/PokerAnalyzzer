---
name: app-api
description: >-
  Builds, refactors, and standardizes backend API routes, endpoints, and middleware.
  Use this skill whenever the user asks to build an API, add an endpoint, handle webhooks,
  integrate server actions, or runs /api.
---

# App API & Backend Engineering Skill

This skill guides the agent in developing secure, robust, and type-safe API endpoints for fullstack web applications. It enforces consistent input validation, uniform error responses, authentication verification, and correct HTTP status codes.

---

## API Engineering Standards

### 1. Mandatory Envelope Structure
All API responses must adhere to a predictable response envelope:

```typescript
// Success Response (HTTP 200/201)
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 42 } // optional pagination
}

// Error Response (HTTP 400/401/403/404/500)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable explanation",
    "details": [ ... ] // optional Zod error details
  }
}
```

---

## Step-by-Step API Development Workflow

### Step 1: Endpoint Specification
1. Define HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
2. Define URL route (e.g. `/api/v1/users/[id]`).
3. Define auth requirement:
   - **Public**: No authentication needed.
   - **Authenticated**: User must have a valid session/token.
   - **Authorized/Admin**: User must have specific roles or permissions.

---

### Step 2: Strict Zod Input Validation
Every request body, query parameter, and route parameter MUST be validated with Zod:

```typescript
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["USER", "ADMIN"]).default("USER")
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

If validation fails, return `HTTP 400 Bad Request` with structured error details.

---

### Step 3: Authentication & Permission Guard
1. Extract session or bearer token at the start of the handler.
2. If invalid or missing, return immediately with `HTTP 401 Unauthorized`.
3. Check resource ownership or role privileges:
   - If user doesn't own the resource, return `HTTP 403 Forbidden`.

---

### Step 4: Business Logic & Data Access
1. Isolate reusable domain logic in service files (`src/services/`) if complex.
2. Use parameterized database queries or ORM calls (zero raw SQL interpolation).
3. Wrap operations in database transactions if multi-table mutations are performed.

---

### Step 5: Global Error Handling & HTTP Statuses
1. Catch errors in a structured `try / catch` block.
2. Map errors to appropriate HTTP codes:
   - `400`: Invalid inputs / validation failure.
   - `401`: Missing or expired auth token.
   - `403`: Insufficient permissions.
   - `404`: Resource not found.
   - `409`: Conflict (e.g. unique constraint collision).
   - `429`: Rate limit exceeded.
   - `500`: Internal server error (log stack trace internally, return sanitized message).

---

### Step 6: Documentation & Blueprint Sync
1. Update `.agents/blueprint/ARCHITECTURE.md` with the new endpoint contract.
2. Update `.agents/blueprint/PROJECT_STATUS.md` feature matrix.

---

### Step 7: Completion Report
```markdown
## ⚡ API Endpoint Created / Updated

- **Route**: `[METHOD] /api/...`
- **Auth**: [Public / Protected / Admin]
- **Validation Schema**: [Schema Name]
- **Response Format**: Standard Envelope (`{ success, data, error }`)
- **Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized, 500 Internal Error
```

---

## Error Handling & Fallbacks

If API development or endpoint execution encounters defects:
1. **Zod Parsing Failures**: Always inspect `.error.flatten()` to ensure specific field errors are returned with human-readable hints rather than raw schema dumps.
2. **CORS Rejections**: Verify frontend port and protocol (`http://localhost:3000` vs `http://localhost:5173`) are explicitly listed in CORS configuration.
3. **Database Connection Drops**: Implement database connection retry logic with exponential backoff for serverless cold starts.
4. **Escalate**: If 500 Internal Server Errors persist without clear tracebacks, activate `/debug` or review server stdout logs.

