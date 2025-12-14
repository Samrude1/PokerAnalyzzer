---
description: Initial project setup and environment configuration
---

# Project Setup Workflow

This workflow guides you through setting up a new web/mobile project from scratch.

## Prerequisites

- Docker Desktop installed (for containerized development)
- WSL2 enabled (Windows) or native Linux/Mac environment
- Node.js LTS version installed
- Git configured with user name and email

## Setup Steps

### 1. Initialize Repository Structure

Create the monorepo structure:
```
project/
├── apps/
│   ├── web/
│   └── mobile/
├── packages/
│   └── shared/
├── infra/
├── docs/
│   └── decisions/
├── .agent/
│   ├── rules/
│   └── workflows/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

### 2. Initialize Git Repository

// turbo
```bash
git init
git add .
git commit -m "chore: initial commit"
```

### 3. Configure Development Environment

Create `.editorconfig`:
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

### 4. Setup Linting and Formatting

Install ESLint and Prettier:
```bash
npm install -D eslint prettier eslint-config-prettier
npx eslint --init
```

Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 5. Setup Commit Hooks

Install husky and commitlint:
```bash
npm install -D husky @commitlint/cli @commitlint/config-conventional
npx husky init
```

Create `.commitlintrc.json`:
```json
{
  "extends": ["@commitlint/config-conventional"]
}
```

### 6. Create Docker Development Environment

Create `docker-compose.yml` for local development:
```yaml
version: '3.8'
services:
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    volumes:
      - ./apps/web:/app
    environment:
      - NODE_ENV=development
```

### 7. Initialize Documentation

Create baseline documentation files:
- `README.md` - Project overview and setup instructions
- `docs/ARCHITECTURE.md` - System architecture
- `docs/CONTRIBUTING.md` - Contribution guidelines
- `docs/SECURITY.md` - Security policies
- `CHANGELOG.md` - Version history

### 8. Setup CI/CD Pipeline

Create `.github/workflows/ci.yml` (or equivalent for your CI platform):
```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

### 9. Configure Environment Variables

Create `.env.example`:
```
NODE_ENV=development
API_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/mydb
```

Add `.env` to `.gitignore`

### 10. Verify Setup

// turbo
Run verification checks:
```bash
npm run lint
npm test
docker-compose up -d
```

## Success Criteria

- ✅ Repository structure created
- ✅ Git initialized with proper .gitignore
- ✅ Linting and formatting configured
- ✅ Commit hooks working
- ✅ Docker environment running
- ✅ Documentation baseline created
- ✅ CI/CD pipeline configured
- ✅ All verification checks pass

## Next Steps

After setup is complete:
1. Run `/webworkflow` to start the development process
2. Create your first ADR documenting tech stack decisions
3. Begin Phase 1: Foundation development
