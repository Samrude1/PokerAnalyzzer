# API Development Workflow

When creating new API endpoints (Next.js Route Handlers or FastAPI endpoints):

1. **Architect** (`/architect`):
   - Define the Request payload, Response payload, and Route path.
   - Determine if the endpoint needs to be public or protected.
   - Present the API contract to the user.

2. **Develop**:
   - Implement the endpoint.
   - **Validation**: Strictly validate incoming data (e.g., using Zod in Next.js, or Pydantic in FastAPI).
   - **Authentication**: Verify Auth.js session token or JWT before executing business logic for protected routes.
   - **Error Handling**: Use consistent error formats (e.g., `{ error: "Message", code: 400 }`) and proper HTTP status codes.

3. **Review** (`/review`):
   - Verify the endpoint matches the architectural plan and handles edge cases properly.

4. **Imprint** (`/remember` save):
   - Document the endpoint if we maintain an API registry, or ensure it's strongly typed so the frontend can infer it. Update memory at the end.
