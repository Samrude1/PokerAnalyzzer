# RESTful API Documentation Template

```markdown
# 📡 API Reference Documentation (API.md)

This document describes the public and private HTTP API endpoints, request contracts, authentication methods, and response schemas.

---

## 🔐 Authentication & Headers

All authenticated endpoints require an Authorization Bearer token or a valid HTTP-only session cookie.

```http
Authorization: Bearer <your_token>
Content-Type: application/json
Accept: application/json
```

---

## 📦 Standard Response Envelope

All API endpoints return responses encapsulated in the standardized JSON envelope:

### Success Response (HTTP 200 / 201)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150
  }
}
```

### Error Response (HTTP 400 / 401 / 403 / 404 / 500)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable explanation",
    "details": [
      {
        "field": "email",
        "issue": "Invalid email address format"
      }
    ]
  }
}
```

---

## 🚀 Endpoints

### 1. Health & Status
#### `GET /api/health`
Checks server readiness and database connectivity.
- **Auth**: None (Public)
- **Response**:
  ```json
  { "status": "ok", "timestamp": "2026-09-03T18:00:00Z", "version": "1.0.0" }
  ```

---

### 2. Resources ([Entity Name])

#### `GET /api/v1/[resources]`
List all records with optional pagination and filtering.
- **Auth**: Required
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 100)
  - `search` (string, optional)
- **Response**: `200 OK` with array of items.

#### `POST /api/v1/[resources]`
Create a new record.
- **Auth**: Required
- **Request Body (JSON)**:
  ```json
  {
    "title": "Item title",
    "description": "Optional description"
  }
  ```
- **Response**: `201 Created` with created record.
- **Errors**: `400 Bad Request` (Zod validation failure).

#### `GET /api/v1/[resources]/:id`
Fetch a specific record by ID.
- **Auth**: Required (Ownership check enforced)
- **Response**: `200 OK`
- **Errors**: `404 Not Found`, `403 Forbidden`.

#### `PATCH /api/v1/[resources]/:id`
Update fields on an existing record.
- **Auth**: Required
- **Response**: `200 OK`

#### `DELETE /api/v1/[resources]/:id`
Delete or soft-delete a record.
- **Auth**: Required
- **Response**: `200 OK`
```
