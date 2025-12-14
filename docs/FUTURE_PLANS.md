# Future Plans & Roadmap

This document outlines planned features and improvements for the Poker Training App.

## Phase 1: Session Analytics ✅ COMPLETED
**Status**: Implemented in v0.1.0

- [x] Session Dashboard with PokerTracker-style graphs
- [x] Real-time statistics (VPIP, PFR, 3-Bet%, AF, bb/100)
- [x] Hand history tracking
- [x] Detailed hand viewer with action logs
- [x] Opponent hole card reveal in history

## Phase 2: Database Integration & Persistence
**Priority**: High  
**Estimated Timeline**: 2-3 weeks

### Goals
Enable long-term session tracking and historical analysis across multiple sessions.

### Features
- [ ] **IndexedDB Integration**
  - Store hand histories locally in browser
  - Session management (create, load, delete sessions)
  - Export/import session data (JSON format)
  
- [ ] **Enhanced Analytics**
  - Multi-session aggregate statistics
  - Performance trends over time
  - Win rate by position
  - Profit/loss by hand strength
  - Session comparison tools

- [ ] **Data Management**
  - Session naming and tagging
  - Date range filtering
  - Search and filter hand histories
  - Bulk export for external analysis

### Technical Considerations
- Use `idb` library for IndexedDB wrapper
- Implement data migration strategy for schema updates
- Add data size limits and cleanup utilities
- Ensure privacy (all data stays local)

### Success Metrics
- Store 10,000+ hands without performance degradation
- Query response time < 100ms for filters
- Export/import functionality working reliably

---

## Phase 3: Advanced Bot AI Improvements
**Priority**: Medium  
**Estimated Timeline**: 3-4 weeks

### Goals
Enhance bot decision-making to provide more realistic and challenging opponents.

### Features

#### 3.1 GTO Solver Integration
- [ ] **Pre-computed Range Tables**
  - Import GTO solutions for common spots (6-max cash game)
  - Position-based opening ranges
  - 3-bet/4-bet ranges by position
  - Calling ranges vs raises

- [ ] **Equity Calculations**
  - Real-time equity calculator for All-In EV
  - Monte Carlo simulation for complex scenarios
  - Display equity when reviewing hands

#### 3.2 Advanced Decision-Making
- [ ] **Multi-Street Planning**
  - Bots plan ahead (not just current street)
  - Continuation bet strategies based on turn/river cards
  - Bluff frequency based on board runouts

- [ ] **Opponent Modeling**
  - Track player tendencies (VPIP, PFR, aggression)
  - Adjust strategy based on opponent stats
  - Exploit weak players, defend against strong ones

- [ ] **Bet Sizing Optimization**
  - Polarized vs merged ranges
  - Optimal sizing for value/bluffs
  - Pot geometry considerations

#### 3.3 Difficulty Levels Refinement
- [ ] **Beginner**: Predictable, passive play with leaks
- [ ] **Intermediate**: Solid fundamentals, some exploitable patterns
- [ ] **Advanced**: GTO-based with minor deviations
- [ ] **Pro**: Near-optimal GTO play with adaptive exploits

### Technical Considerations
- Pre-compute and bundle range tables (avoid runtime calculations)
- Optimize Monte Carlo simulations (Web Workers for parallelization)
- Balance realism vs performance (target <500ms decision time)

### Success Metrics
- Pro bots achieve positive win rate vs intermediate players
- Decision time remains under 1 second
- Exploitable leaks in beginner/intermediate bots are detectable

---

## Phase 4: User Experience Enhancements
**Priority**: Medium  
**Estimated Timeline**: 2 weeks

### Features
- [ ] **Hand Replayer**
  - Timeline scrubber to review hand action-by-action
  - Pause/play/rewind controls
  - Show equity at each decision point
  - Highlight mistakes and missed value

- [ ] **Customization Options**
  - Adjustable blind levels
  - Starting stack sizes
  - Table themes (classic, modern, dark mode)
  - Card back designs
  - Sound effects toggle

- [ ] **Tutorial & Help**
  - Interactive poker rules tutorial
  - Stat explanations (VPIP, PFR, etc.)
  - Tooltips for UI elements
  - Strategy tips and recommendations

- [ ] **Achievements & Milestones**
  - Track achievements (first win, 100 hands played, etc.)
  - Leaderboard (local, vs bots)
  - Session goals and challenges

---

## Phase 5: Advanced Features
**Priority**: Low  
**Estimated Timeline**: 4-6 weeks

### Features
- [ ] **Multi-Table Support**
  - Play 2-4 tables simultaneously
  - Synchronized action queues
  - Table switching UI

- [ ] **Tournament Mode**
  - Sit-and-Go tournaments
  - Increasing blinds structure
  - Prize pool distribution
  - Bubble play dynamics

- [ ] **Range Visualizer**
  - Visual hand range selector
  - Compare ranges (hero vs villain)
  - Equity heat maps

- [ ] **HUD (Heads-Up Display)**
  - Real-time opponent stats overlay
  - Color-coded stat indicators
  - Customizable HUD layout

- [ ] **Hand Strength Meter**
  - Real-time equity display during hand
  - Training mode to learn hand values
  - Toggle on/off for practice

---

## Technical Debt & Maintenance

### Ongoing Tasks
- [ ] Fix unused `bb` variable warnings in `BotLogic.ts`
- [ ] Add comprehensive error handling for edge cases
- [ ] Improve test coverage to 90%+
- [ ] Optimize bundle size (code splitting, lazy loading)
- [ ] Add performance monitoring (Lighthouse CI)

### Code Quality
- [ ] Refactor `PokerGame.ts` into smaller modules
- [ ] Extract reusable hooks (useGameState, useHandHistory)
- [ ] Improve TypeScript type safety (stricter types)
- [ ] Add JSDoc comments for public APIs

---

## Community & Feedback

### Planned User Research
- Gather feedback on UI/UX
- Identify most-wanted features
- Test bot difficulty balance
- Validate analytics usefulness

### Documentation
- [ ] API documentation for game engine
- [ ] Architecture decision records (ADRs)
- [ ] Video tutorials and demos
- [ ] FAQ and troubleshooting guide

---

## Long-Term Vision

### Potential Future Directions
- **Mobile App**: Native iOS/Android versions
- **Multiplayer**: Real-time online play with friends
- **AI Training**: Use reinforcement learning to train bots
- **Cash Game Simulator**: Realistic bankroll management
- **Coaching Mode**: AI suggests optimal plays in real-time

---

**Last Updated**: 2025-12-14  
**Next Review**: End of Phase 2 (Database Integration)
