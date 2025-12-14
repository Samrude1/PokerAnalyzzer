---
description: Universal project setup and bootstrapping guide
---

# Universal Setup Workflow

This workflow provides a standardized approach to initializing any new software project, ensuring a consistent and high-quality development environment from Day 1.

## 1. Repository Initialization

**Objective**: Establish a clean, version-controlled foundation.

- [ ] **Git Init**: `git init` in the project root.
- [ ] **.gitignore**: Add standard exclusions (node_modules, dist, logs, env vars).
- [ ] **README.md**: Create a placeholder with "Title", "Description", and "Setup" sections.
- [ ] **License**: Add appropriate license file.

## 2. Code Quality Configuration

**Objective**: Enforce consistent style and catch errors early.

- [ ] **EditorConfig**: Create `.editorconfig` to unify editor settings (indentation, line endings).
- [ ] **Linter**: Install and configure a linter appropriate for the language (e.g., ESLint for JS/TS, Pylint for Python).
  - *Recommendation*: Use standard/strict configs to avoid bike-shedding.
- [ ] **Formatter**: Configure a code formatter (Prettier, Black, GoFmt).
  - *Tip*: Set up "Format on Save" in VS Code `settings.json`.

## 3. Git Hooks (Pre-commit)

**Objective**: Prevent bad code from entering the repository.

- [ ] **Install Tool**: Use Husky (JS) or pre-commit (Python/General).
- [ ] **Configure Hooks**:
  - `pre-commit`: Run lint-staged and unit tests.
  - `commit-msg`: Enforce Conventional Commits (e.g., "feat: add login").

## 4. Development Environment

**Objective**: Ensure "it works on my machine" applies to everyone.

- [ ] **Version Pinning**: Create `.nvmrc` (Node), `.python-version`, or `go.mod` to lock runtime versions.
- [ ] **Dependency Management**: Install dependencies using a lockfile (`package-lock.json`, `yarn.lock`, etc.).
- [ ] **Environment Variables**:
  - Create `.env.example` with dummy values.
  - Add `.env` to `.gitignore`.

## 5. Documentation Baseline

**Objective**: Make the project discoverable and easy to join.

- [ ] **ARCHITECTURE.md**: High-level system overview and diagram.
- [ ] **CONTRIBUTING.md**: Guide for new developers (setup, testing standards).
- [ ] **CHANGELOG.md**: Initialize for tracking version history.

## 6. CI/CD Skeleton

**Objective**: Automate verification immediately.

- [ ] **Pipeline Config**: Create `.github/workflows/ci.yml` (or Gitlab CI/CircleCI).
- [ ] **Jobs**:
  - `Build`: Verify the project builds.
  - `Test`: Run unit tests.
  - `Lint`: Check code style.

## Verification Checklist

Run these commands to verify the setup is robust:

- [ ] `git status` (Should show clean ignore list)
- [ ] `npm run lint` / `make lint` (Should pass)
- [ ] `npm test` / `make test` (Should pass)
- [ ] `npm run build` / `make build` (Should build artifacts)
