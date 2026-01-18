---
description: Streamlined workflow for solo/small projects - professional but pragmatic
---

# Solo Project Workflow

A lightweight, professional workflow for solo developers and small projects (learning, portfolio, MVPs, prototypes). Focuses on quality without over-engineering.

## 🎯 When to Use This Workflow

**Perfect for:**
- Solo learning projects
- Portfolio pieces
- Personal tools
- Quick MVPs/prototypes
- Projects under 3 months
- Single developer projects

**Use `/webworkflow` instead if:**
- Team of 2+ developers
- Production SaaS with users
- Compliance requirements (GDPR, SOC2)
- Revenue-generating product

---

## Phase 1: Planning (15-30 minutes)

### 1. Define the MVP Scope
Write down the **absolute minimum** features needed to validate your idea:
```markdown
## MVP Features (Week 1)
- [ ] Feature 1 (core functionality)
- [ ] Feature 2 (essential)
- [ ] Feature 3 (must-have)

## Nice-to-Have (Later)
- [ ] Feature 4
- [ ] Feature 5
```

**Rule:** If you can't build it in 1-4 weeks, it's too big. Cut scope.

### 2. Choose Your Stack
Pick technologies you **already know** or want to learn:
```
Frontend: React/Vue/Vanilla JS
Styling: CSS/Tailwind
Build: Vite/Next.js
Language: TypeScript (recommended) or JavaScript
```

**Rule:** Don't try 5 new technologies at once. Max 1-2 new things per project.

### 3. Sketch the Architecture
Quick diagram or bullet points:
```
- UI Components: [list 3-5 main components]
- Core Logic: [list 2-3 main modules]
- Data Flow: [how data moves through app]
```

---

## Phase 2: Setup (30 minutes)

### 1. Initialize Project
```bash
# Create project with your preferred tool
npm create vite@latest my-project -- --template react-ts
cd my-project
npm install
```

### 2. Essential Configuration
Create these files:

**.gitignore**
```
node_modules/
dist/
.env.local
.DS_Store
```

**README.md** (minimum viable)
```markdown
# Project Name

Brief description (1-2 sentences)

## Quick Start
npm install
npm run dev

## Features
- Feature 1
- Feature 2

## Tech Stack
- React + TypeScript + Vite
```

### 3. Code Quality Tools
```bash
# ESLint (if not included)
npm install -D eslint

# Optional but recommended
npm install -D prettier
```

### 4. Folder Structure
```
src/
├── components/     # UI components
├── [domain]/       # Core logic (e.g., game/, utils/, api/)
├── App.tsx
└── index.css
```

**Rule:** Keep it simple. Don't create folders until you need them.

---

## Phase 3: Build (Iterative)

### Development Loop (Repeat Daily)

**1. Pick ONE Feature**
Focus on one feature at a time. No multitasking.

**2. Build It**
```
- Write the minimal code to make it work
- Test manually in the browser
- Commit when it works
```

**3. Refactor (Optional)**
If code is messy, clean it up. But don't over-optimize.

**4. Commit**
```bash
git add .
git commit -m "feat: add [feature name]"
```

Use conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code cleanup
- `docs:` documentation
- `style:` formatting

### When to Write Tests

**Always test:**
- ✅ Complex logic (algorithms, calculations, game rules)
- ✅ Functions that broke before
- ✅ Critical user flows (payment, auth, data loss)

**Skip testing:**
- ❌ Simple UI components
- ❌ Prototypes you'll throw away
- ❌ Code that's obviously correct

**Example:**
```typescript
// YES - Test this (complex logic)
describe('HandEvaluator', () => {
  it('should detect royal flush', () => {
    // ...
  });
});

// NO - Don't test this (simple UI)
const Button = ({ onClick, children }) => (
  <button onClick={onClick}>{children}</button>
);
```

### Code Quality Checklist (Before Each Commit)

```
[ ] Code works (tested manually)
[ ] No console errors
[ ] TypeScript has no errors
[ ] ESLint passes (npm run lint)
[ ] Code is readable (good names, not too complex)
```

---

## Phase 4: Polish (When MVP is Done)

### 1. User Experience
```
[ ] Loading states for async operations
[ ] Error messages are helpful
[ ] Mobile responsive (if web app)
[ ] Smooth animations/transitions
```

### 2. Documentation
Update README with:
```
[ ] Clear setup instructions
[ ] Feature list
[ ] Screenshots/demo (optional but nice)
[ ] Tech stack
```

### 3. Code Cleanup
```
[ ] Remove commented-out code
[ ] Remove console.logs
[ ] Fix ESLint warnings
[ ] Organize imports
```

---

## Phase 5: Deploy (Optional)

### Quick Deploy Options

**Static Sites (Frontend Only):**
```bash
# Vercel (easiest)
npm install -g vercel
vercel

# Netlify
npm run build
# Drag dist/ folder to netlify.com

# GitHub Pages
npm run build
# Push dist/ to gh-pages branch
```

**Full-Stack Apps:**
- Vercel (Next.js)
- Railway (Node.js + DB)
- Render (any stack)

### Pre-Deploy Checklist
```
[ ] Build works (npm run build)
[ ] No hardcoded secrets (use .env)
[ ] Error handling for production
[ ] Analytics (optional: Google Analytics, Plausible)
```

---

## Phase 6: Iterate or Ship

### Option A: Ship It
```
[ ] Push to GitHub
[ ] Add to portfolio
[ ] Share with friends/Twitter
[ ] Move to next project
```

### Option B: Iterate
```
[ ] Gather feedback
[ ] Add 1-3 new features
[ ] Repeat Phase 3-4
```

**Rule:** Don't endlessly polish. Ship or move on.

---

## Quality Standards (Pragmatic)

### Must Have
- ✅ Works without bugs
- ✅ Clean, readable code
- ✅ Basic documentation (README)
- ✅ Git commits

### Nice to Have
- 📊 Tests for complex logic
- 🎨 Beautiful UI
- 📱 Mobile responsive
- 🚀 Deployed live

### Don't Worry About
- ❌ 100% test coverage
- ❌ Perfect architecture
- ❌ Scalability (until you need it)
- ❌ Every edge case

---

## Common Pitfalls to Avoid

### ❌ Over-Engineering
```
Bad:  Setting up microservices, Docker, K8s for a todo app
Good: Single app, simple deployment
```

### ❌ Analysis Paralysis
```
Bad:  Spending 2 weeks researching the "perfect" stack
Good: Pick familiar tools, start building in 1 hour
```

### ❌ Feature Creep
```
Bad:  Adding 10 more features before finishing MVP
Good: Ship MVP, then decide what's next
```

### ❌ Perfectionism
```
Bad:  Refactoring for weeks, never shipping
Good: Ship when it works, iterate if needed
```

---

## Tools Reference

### Essential
- **Git**: Version control
- **ESLint**: Code quality
- **TypeScript**: Type safety (recommended)

### Optional but Useful
- **Prettier**: Auto-formatting
- **Vitest**: Testing
- **Tailwind CSS**: Rapid styling
- **React DevTools**: Debugging

### Skip for Now
- Docker (unless deploying)
- CI/CD (unless team project)
- Monitoring (unless production)
- ADRs (unless complex decisions)

---

## Success Metrics

**You're doing it right if:**
- ✅ Shipping features regularly (daily/weekly)
- ✅ Code is readable when you return to it
- ✅ No major bugs in core functionality
- ✅ You're learning and having fun

**Warning signs:**
- ⚠️ Stuck in planning for >1 week
- ⚠️ Rewriting the same code 5+ times
- ⚠️ Adding tools instead of features
- ⚠️ Not shipping anything for months

---

## Quick Reference Commands

```bash
# Start new project
npm create vite@latest my-app -- --template react-ts
cd my-app && npm install

# Development
npm run dev          # Start dev server
npm run lint         # Check code quality
npm run build        # Build for production
npm run preview      # Preview production build

# Git workflow
git add .
git commit -m "feat: add feature name"
git push

# Deploy (Vercel)
npm install -g vercel
vercel
```

---

## When to Graduate to `/webworkflow`

Move to the full webworkflow when:
- 🎯 Adding a second developer
- 💰 Generating revenue
- 👥 Real users depending on it
- 🔒 Need compliance (GDPR, etc.)
- 📈 Scaling beyond prototype

Until then, keep it simple and ship! 🚀
