# .agent Directory

This directory contains AI agent configuration, rules, and workflows for the Antigravity AI coding assistant.

## Structure

```
.agent/
├── README.md           # This file - overview of agent configuration
├── rules/              # Global rules that the AI must follow
│   └── webrules.md    # Web development standards and best practices
└── workflows/          # Predefined workflows for common tasks
    └── webworkflow.md # Meta workflow for web/mobile projects
```

## Rules

Rules are defined in the `rules/` directory and are **always enforced** by the AI. They take precedence over any other instructions.

### Current Rules:
- **webrules.md**: Comprehensive web development standards including:
  - Core principles (transparency, reproducibility, minimal first)
  - Project structure requirements
  - Code quality & testing standards
  - Performance & accessibility targets
  - Security & compliance guidelines
  - Agent orchestration patterns

## Workflows

Workflows are defined in the `workflows/` directory and provide step-by-step instructions for common tasks.

### Available Workflows:
- **/webworkflow**: Meta workflow for orchestrating web/mobile projects with defined roles, phases, and quality gates

### Using Workflows:
1. Reference workflows using slash commands: `/webworkflow`
2. The AI will read and follow the workflow steps
3. Workflows can have `// turbo` annotations for auto-execution
4. `// turbo-all` enables auto-execution for all steps

## Quality Gates

All projects must meet these minimum standards:
- **Lighthouse Score**: ≥ 90
- **Unit Test Coverage**: ≥ 80%
- **E2E Tests**: Required for sprint completion
- **E2E Pass Rate**: ≥ 95%
- **Mobile Cold Start**: ≤ 2s target

## Agent Roles

The following agent roles are defined in the workflow:
- **Architect**: Scope, architecture, tech stack, ADRs
- **WebDev**: Next.js/React, components, APIs, accessibility
- **MobileDev**: React Native/Kotlin/Swift, native integrations
- **TestEngineer**: Unit/integration/e2e test design and execution
- **DocWriter**: README, ARCHITECTURE, ADR, CHANGELOG
- **Ops**: Infrastructure, deployment, observability, secrets

## Adding New Rules

To add new rules:
1. Create a new `.md` file in `.agent/rules/`
2. Document the rules clearly
3. The AI will automatically enforce them

## Adding New Workflows

To add new workflows:
1. Create a new `.md` file in `.agent/workflows/`
2. Use the following format:
```markdown
---
description: Short description of what this workflow does
---

# Workflow Name

1. First step description
2. Second step description
// turbo (optional - enables auto-execution for next step)
3. Third step description
```

## Maintenance

- Review and update rules quarterly
- Keep workflows aligned with current project needs
- Document all significant decisions in ADR format
- Ensure all team members understand the agent configuration
