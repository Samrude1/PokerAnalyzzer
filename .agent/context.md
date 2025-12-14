# Project Context

This file provides project-specific context for the Antigravity AI assistant.

## Project Overview

**Project Name**: [Your Project Name]  
**Type**: Web Application  
**Status**: In Development  
**Started**: December 2025

## Technology Stack

### Frontend
- **Framework**: [e.g., Next.js, React, Vue]
- **Language**: JavaScript/TypeScript
- **Styling**: CSS / [Framework if any]
- **State Management**: [e.g., Redux, Zustand, Context API]

### Backend
- **Runtime**: Node.js
- **Framework**: [e.g., Express, Fastify, Next.js API routes]
- **Database**: [e.g., PostgreSQL, MongoDB, MySQL]
- **ORM**: [e.g., Prisma, TypeORM, Sequelize]

### Infrastructure
- **Hosting**: [e.g., Vercel, AWS, Azure]
- **CI/CD**: [e.g., GitHub Actions, GitLab CI]
- **Containerization**: Docker
- **Development**: WSL2 / Docker Desktop

## Current Sprint

**Sprint Goal**: [Define current sprint objective]

**Active Features**:
- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3

**Blockers**: None

## Architecture Decisions

Key architectural decisions are documented in `docs/decisions/` following the ADR format.

**Recent ADRs**:
- ADR-001: [Decision title]
- ADR-002: [Decision title]

## Code Organization

```
project/
├── apps/
│   ├── web/           # Web application
│   └── mobile/        # Mobile application (if applicable)
├── packages/
│   └── shared/        # Shared utilities and components
├── docs/              # Documentation
├── tests/             # Test suites
└── infra/             # Infrastructure as code
```

## Development Workflow

1. Create feature branch from `develop`
2. Implement feature with tests
3. Run quality checks (`npm run lint`, `npm test`)
4. Create pull request
5. Code review and approval
6. Merge to `develop`
7. Auto-deploy to staging
8. Manual deploy to production

## Quality Standards

- **Test Coverage**: ≥ 80%
- **Lighthouse Score**: ≥ 90
- **E2E Pass Rate**: ≥ 95%
- **Build Time**: ≤ 5 minutes
- **Bundle Size**: Monitor and optimize

## Known Issues

### Technical Debt
- [ ] [Item 1]
- [ ] [Item 2]

### Bugs
- [ ] [Bug 1]
- [ ] [Bug 2]

## Team Preferences

### Code Style
- Use functional components (React)
- Prefer composition over inheritance
- Keep functions small and focused
- Write self-documenting code
- Add comments for complex logic only

### Naming Conventions
- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Components**: PascalCase (e.g., `UserProfile`)
- **Functions**: camelCase (e.g., `getUserData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

### Git Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## External Dependencies

### APIs
- [API Name]: [Purpose and documentation link]

### Third-party Services
- [Service Name]: [Purpose and configuration]

## Environment Variables

Required environment variables are documented in `.env.example`

**Critical Variables**:
- `DATABASE_URL`: Database connection string
- `API_KEY`: External API authentication
- `JWT_SECRET`: Authentication secret

## Deployment

### Environments
- **Development**: http://localhost:3000
- **Staging**: [Staging URL]
- **Production**: [Production URL]

### Deployment Schedule
- Staging: Automatic on merge to `develop`
- Production: Manual, typically Friday afternoons

## Monitoring & Observability

### Error Tracking
- **Tool**: [e.g., Sentry, Bugsnag]
- **Dashboard**: [Link]

### Performance Monitoring
- **Tool**: [e.g., New Relic, Datadog]
- **Dashboard**: [Link]

### Logging
- **Tool**: [e.g., CloudWatch, Loggly]
- **Access**: [Instructions]

## Documentation

### Key Documents
- `README.md`: Project overview and setup
- `docs/ARCHITECTURE.md`: System architecture
- `docs/CONTRIBUTING.md`: Contribution guidelines
- `docs/API.md`: API documentation

### API Documentation
- **Format**: OpenAPI / Swagger
- **Location**: [Link or path]

## Security

### Security Practices
- Never commit secrets to repository
- Use environment variables for sensitive data
- Regular dependency audits (`npm audit`)
- Security headers configured
- Input validation on all endpoints

### Compliance
- GDPR compliance required: [Yes/No]
- Data retention policy: [Details]
- Privacy policy: [Link]

## Performance Targets

### Web
- **First Contentful Paint**: ≤ 1.8s
- **Largest Contentful Paint**: ≤ 2.5s
- **Time to Interactive**: ≤ 3.8s
- **Cumulative Layout Shift**: ≤ 0.1

### Mobile
- **Cold Start**: ≤ 2s
- **Frame Rate**: ≥ 60 FPS
- **Memory Usage**: ≤ 100MB baseline

## Accessibility

- **Standard**: WCAG 2.1 Level AA
- **Testing**: Automated with axe-core
- **Manual Testing**: Keyboard navigation, screen readers

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Future Roadmap

### Q1 2025
- [ ] Feature A
- [ ] Feature B
- [ ] Performance optimization

### Q2 2025
- [ ] Feature C
- [ ] Mobile app launch
- [ ] Internationalization

## Notes for AI Assistant

### Preferences
- Prioritize code quality over speed
- Always include tests with new features
- Document complex logic
- Follow established patterns in codebase
- Ask for clarification when requirements are ambiguous

### Common Tasks
- Creating new components
- Adding API endpoints
- Writing tests
- Debugging issues
- Performance optimization

### Avoid
- Installing unnecessary dependencies
- Breaking changes without discussion
- Skipping tests
- Ignoring accessibility
- Hardcoding values

---

**Last Updated**: 2025-12-04  
**Updated By**: [Your Name]
