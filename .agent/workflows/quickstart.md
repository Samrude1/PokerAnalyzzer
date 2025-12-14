---
description: Quick sample app to test the full workflow cycle
---

# Quickstart: Sample App Full Cycle

This workflow guides you through creating a small sample app to test the entire workflow system from setup to deployment.

## Sample App Ideas (Pick One)

### Option 1: Todo List App
**Features**:
- Add/edit/delete todos
- Mark as complete
- Filter by status
- Local storage persistence

**Tech Stack**: HTML + CSS + Vanilla JavaScript (simple, no framework)
**Time**: ~2-3 hours for full cycle

### Option 2: Weather Dashboard
**Features**:
- Search city weather
- Display current conditions
- 5-day forecast
- Save favorite cities

**Tech Stack**: Next.js + OpenWeather API
**Time**: ~3-4 hours for full cycle

### Option 3: Random Quote Generator
**Features**:
- Display random quotes
- Category filter
- Share to social media
- Favorite quotes

**Tech Stack**: Vite + React + Quote API
**Time**: ~2-3 hours for full cycle

## Full Cycle Checklist

### Phase 0: Planning (15 min)
- [ ] Choose app idea
- [ ] Define MVP scope (3-5 core features max)
- [ ] Select tech stack
- [ ] Create ADR-001 documenting tech stack decision

### Phase 1: Setup (30 min)
// turbo-all
- [ ] Run `/setup` workflow
- [ ] Initialize project structure
- [ ] Configure linting and formatting
- [ ] Set up Git with commit hooks
- [ ] Create baseline documentation (README, ARCHITECTURE)

### Phase 2: Foundation (30 min)
- [ ] Create design system (colors, typography, spacing)
- [ ] Set up component structure
- [ ] Configure build tools
- [ ] Add basic routing (if needed)

### Phase 3: MVP Development (60-90 min)
- [ ] Implement core features
- [ ] Write unit tests for each feature
- [ ] Add integration tests
- [ ] Ensure accessibility (semantic HTML, ARIA)

### Phase 4: Quality Gate (30 min)
// turbo
- [ ] Run `/test` workflow
- [ ] Check coverage ≥ 80%
- [ ] Run Lighthouse (target ≥ 90)
- [ ] Fix any accessibility issues
- [ ] Run security audit

### Phase 5: Deployment (30 min)
- [ ] Run `/deploy` workflow
- [ ] Deploy to staging (Vercel/Netlify free tier)
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Verify live site

### Phase 6: Documentation (15 min)
- [ ] Update README with live demo link
- [ ] Update CHANGELOG
- [ ] Document lessons learned
- [ ] Create retrospective notes

## Success Criteria

At the end, you should have:
- ✅ Working app deployed live
- ✅ All tests passing
- ✅ Lighthouse score ≥ 90
- ✅ Test coverage ≥ 80%
- ✅ Complete documentation
- ✅ Git history with conventional commits
- ✅ ADR documenting key decisions

## Recommended: Todo List App (Simplest)

**Why**: No external APIs, no backend, pure frontend, fast to build

**MVP Features**:
1. Add todo with text input
2. Mark todo as complete (checkbox)
3. Delete todo
4. Filter: All / Active / Completed
5. Persist to localStorage

**File Structure**:
```
todo-app/
├── index.html
├── styles.css
├── app.js
├── tests/
│   ├── app.test.js
│   └── integration.test.js
├── docs/
│   ├── ARCHITECTURE.md
│   └── decisions/
│       └── ADR-001-vanilla-js.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── README.md
└── CHANGELOG.md
```

**Estimated Timeline**:
- Planning: 15 min
- Setup: 30 min
- Development: 60 min
- Testing: 30 min
- Deployment: 20 min
- Documentation: 15 min
**Total**: ~2.5 hours

## Commands to Run

### Setup Phase
```bash
# Create project directory
mkdir todo-app
cd todo-app

# Initialize Git
git init

# Create files
touch index.html styles.css app.js
mkdir -p tests docs/decisions .github/workflows
```

### Development Phase
```bash
# Install testing tools
npm init -y
npm install -D jest @testing-library/dom @testing-library/jest-dom
npm install -D eslint prettier husky

# Start development
# (Use Live Server or similar)
```

### Testing Phase
```bash
# Run tests
npm test

# Check coverage
npm test -- --coverage

# Run Lighthouse
npx lighthouse http://localhost:8080 --view
```

### Deployment Phase
```bash
# Deploy to Vercel
npx vercel

# Or Netlify
npx netlify deploy
```

## What We'll Learn

By completing this full cycle, we'll validate:
1. ✅ `/setup` workflow creates proper structure
2. ✅ `/webworkflow` phases guide development
3. ✅ `/test` workflow ensures quality
4. ✅ `/deploy` workflow handles deployment
5. ✅ Quality gates are achievable
6. ✅ Documentation is complete
7. ✅ Entire system works end-to-end

## Potential Issues to Watch For

- **Setup**: Missing dependencies or config files
- **Development**: Unclear phase transitions
- **Testing**: Coverage targets too strict/loose
- **Deployment**: Environment variable management
- **Documentation**: Missing required sections

## Post-Session Retrospective

After completing the app, document:
- What worked well?
- What was confusing?
- What workflows need adjustment?
- What's missing from the system?
- What should be added/removed?

## Next Steps After Quickstart

Once the sample app is complete:
1. Review and refine workflows based on learnings
2. Update quality gates if needed
3. Add any missing workflow steps
4. Create templates for common files
5. Ready to use system for real projects!

---

**Status**: Ready for tomorrow's session  
**Recommended App**: Todo List (simplest, fastest)  
**Expected Duration**: 2.5-3 hours  
**Goal**: Validate entire workflow system end-to-end
