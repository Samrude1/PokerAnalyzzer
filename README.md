# Poker App - 6-Max No-Limit Texas Hold'em

A single-player, 6-handed No-Limit Texas Hold'em poker training application built with React, TypeScript, and Vite. Play against intelligent bot opponents with realistic poker AI, track your performance with PokerTracker-style analytics, and review detailed hand histories.

## 🎯 Features

### Current Implementation
- ✅ **6-Max No-Limit Hold'em**: Full 6-player table with complete game phases
- ✅ **Intelligent Bot AI**: Multiple difficulty levels (Beginner, Intermediate, Advanced, Pro)
  - Position-aware hand ranges (GTO-based)
  - Dynamic bet sizing (2.2x-2.5x opens, pot-based c-bets)
  - Balanced 3-bet strategies with bluffs
  - Board texture analysis (dry vs wet boards)
- ✅ **Session Analysis Dashboard**: PokerTracker-style analytics
  - 📊 Interactive graphs (Net Won, All-In EV, Showdown/Non-Showdown lines)
  - 📈 Real-time stats (VPIP, PFR, 3-Bet%, AF, bb/100)
  - 🃏 Detailed hand history viewer with action logs
  - 👁️ Review opponent hole cards in completed hands
- ✅ **Professional UI/UX**:
  - Smooth animations and transitions
  - Responsive design (mobile-friendly)
  - Real-time chip and pot tracking
  - Audio feedback for actions
  - Visual card dealing animations

### Game Rules
- **Blinds**: $1 Small Blind / $2 Big Blind
- **Starting Chips**: $200 per player
- **Betting Structure**: No-Limit (all-in allowed)
- **Hand Rankings**: Standard poker rankings (High Card → Royal Flush)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+ or compatible package manager

### Installation

```bash
# Navigate to project directory
cd "c:\Users\samru\DEVELOPER\APPS\Poker App"

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run linter
npm run lint
```

**Coverage Targets**: ≥80% for critical modules (game logic, hand evaluation)

## 📁 Project Structure

```
poker-app/
├── src/
│   ├── components/          # React UI components
│   │   ├── Card.tsx        # Card display with animations
│   │   ├── Controls.tsx    # Player action controls
│   │   ├── HandDetailsModal.tsx  # Hand replay viewer
│   │   ├── PokerTable.tsx  # Main table layout
│   │   ├── Seat.tsx        # Player seat with stats
│   │   ├── SessionDashboard.tsx  # Analytics dashboard
│   │   └── ShowdownOverlay.tsx   # Winner announcement
│   ├── game/               # Core game logic
│   │   ├── BotLogic.ts     # AI decision-making engine
│   │   ├── Deck.ts         # Deck management
│   │   ├── HandEvaluator.ts # Hand ranking evaluation
│   │   ├── PokerGame.ts    # Main game state engine
│   │   └── types.ts        # TypeScript interfaces
│   ├── utils/              # Utility functions
│   │   └── SoundManager.ts # Audio feedback
│   ├── App.tsx             # Main application
│   └── index.css           # Global styles & design tokens
├── docs/                   # Documentation
│   └── FUTURE_PLANS.md     # Roadmap and planned features
├── .agent/                 # AI agent configuration
└── package.json
```

## 🎮 How to Play

1. **Choose Table Type**: Select bot difficulty (Beginner, Intermediate, Advanced, Pro, or Mixed)
2. **Play Hands**: Use the action buttons (Fold, Check, Call, Raise) to make decisions
3. **Track Performance**: Click the "📊 Stats" button to view your session analytics
4. **Review Hands**: Click any hand in the history to see detailed action logs and opponent cards
5. **Buy-In**: If you lose all chips, click "Buy In" to reload

## 📊 Session Dashboard

The Session Dashboard provides professional-level analytics:

### Graphs
- **Green Line**: Net Winnings (actual profit/loss)
- **Yellow Line**: All-In EV (expected value when all-in)
- **Red Line**: Non-Showdown Winnings (wins from folds)
- **Blue Line**: Showdown Winnings (wins at showdown)

### Statistics
- **VPIP**: Voluntarily Put $ In Pot (%)
- **PFR**: Pre-Flop Raise (%)
- **3-Bet%**: 3-Bet frequency
- **AF**: Aggression Factor (bets+raises / calls)
- **bb/100**: Big blinds won per 100 hands

### Hand History
- Click any hand to view:
  - Community cards and your hole cards
  - Complete action log with all player moves
  - Opponent hole cards (revealed after hand completion)
  - Final pot size and winner(s)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3.4 + Custom CSS
- **Charts**: Recharts
- **Testing**: Vitest
- **Linting**: ESLint + TypeScript ESLint

## 📈 Future Plans

See [docs/FUTURE_PLANS.md](./docs/FUTURE_PLANS.md) for detailed roadmap including:
- Database integration for persistent hand history
- Advanced bot AI improvements (GTO solver integration)
- Multi-table support
- Tournament mode
- Hand replayer with timeline scrubbing

## 🤝 Contributing

### Code Standards
- Follow ESLint + Prettier configuration
- Write tests for all new features (≥80% coverage)
- Use conventional commit messages
- Update documentation for API changes

### Development Workflow
1. **Planning**: Define scope, create ADRs
2. **Execution**: TDD approach with unit tests
3. **Verification**: Lint, test, manual QA

## 📝 License

Private project - All rights reserved

## 📞 Contact

For questions or issues, contact the project maintainer.

---

**Last Updated**: 2025-12-14
**Version**: 0.1.0 (MVP with Session Analytics)
