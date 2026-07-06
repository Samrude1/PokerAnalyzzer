---
description: 
---

# Legacy Project Onboarding Workflow

This workflow is designed to be used when you introduce the `.agents` folder into an existing, legacy, or unfinished project. It guides the agent to map out the current state of the project and initialize it for efficient future development.

1. **Analyze Project** (`/analyze` or `investigate`):
   - **Read the README**: Start by reading the project's `README.md` (if it exists) to understand the overarching goals and context.
   - **Scan Structure**: Recursively scan the project directory to identify core technologies, frameworks, and languages used (e.g., `package.json`, `requirements.txt`, `pom.xml`, `Dockerfile`).
   - **Understand Architecture**: Identify the current directory structure and how key components (frontend, backend, database) interact.

2. **Document Context** (`/imprint`):
   - The agent updates (or creates) the files in the `.agents/context/` directory to reflect the project's reality:
     - `architecture.md`: Document the current architecture and system interactions.
     - `tech-stack.md`: List all found technologies and their versions.
     - `database-schema.md`: If applicable, infer and document the existing database schema (e.g., from Prisma schemas or SQL dumps).

3. **Establish Baseline** (`/remember`):
   - Create or update the `memory.md` file.
   - Establish the "Ground Truth" of the project: What works currently, what is clearly unfinished, and what the immediate next steps or user requests are.

4. **Align & Plan**:
   - Compare the current project structure against the `.agents/AGENTS.md` rules and best practices.
   - If requested, create an `implementation_plan.md` suggesting refactoring steps to align the legacy code with the new standards before building new features.
