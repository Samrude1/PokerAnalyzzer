# AI Agent Development Workflow (FastAPI)

When creating or modifying AI capabilities using LangGraph/CrewAI:

1. **Architect** (`/architect`):
   - Define the Goal of the agent.
   - Define the Prompts and System Instructions.
   - Define the Tools the agent will have access to.
   - Create an implementation plan Artifact for review.

2. **Develop**:
   - Implement the agent in the FastAPI backend.
   - Write clear and concise tool schemas.
   - Ensure the agent's output is structured (e.g., forcing JSON output) if it needs to be parsed by the frontend.
   - Test the agent locally.

3. **Review & Imprint** (`/review`, `/remember` save):
   - Ensure the new agent capabilities are correct and documented so frontend developers know how to trigger and consume the AI results.
