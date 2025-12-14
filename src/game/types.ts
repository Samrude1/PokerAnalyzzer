import { Card } from './Deck';

export type GamePhase = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

export type PlayerRole = 'dealer' | 'small-blind' | 'big-blind' | 'none';

// Position names for 6-max
export type Position = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

export interface PlayerStats {
    handsPlayed: number;
    handsWon: number;
    vpipCount: number;
    pfrCount: number;
    // 3-bet tracking
    threeBetCount: number;
    threeBetOpportunity: number;
    // Advanced
    betsCount: number;
    raisesCount: number;
    callsCount: number;
    showdownsReached: number;
    showdownsWon: number;
    // Session tracking
    sessionPnL: number; // Running profit/loss from hands played only
}

// Bot Difficulty Levels
export type BotDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'pro';

export interface Player {
    id: string;
    name: string;
    chips: number;
    initialChips: number; // Starting chips per buy-in
    totalBuyIn: number;   // Total money bought in across all buy-ins (for session tracking)
    difficulty?: BotDifficulty; // Bot skill level
    cards: Card[]; // Hole cards
    status: 'active' | 'folded' | 'all-in' | 'sitting-out' | 'eliminated';
    currentBet: number; // Bet in the current street
    role: PlayerRole;
    position?: Position; // Table position
    isHuman: boolean;
    avatar?: string;
    hasActed: boolean; // Track if player has acted in the current betting round
    lastAction?: 'fold' | 'check' | 'call' | 'raise' | 'bet' | null;
    stats: PlayerStats;
    // Temp flags for current hand stats tracking
    hasVPIPInHand?: boolean;
    hasPFRInHand?: boolean;
    handContribution: number; // Total chips put into pot this hand (for P/L tracking)
}

export interface WinnerInfo {
    playerIds: string[];
    handDescription: string;
    potWon: number;
    winningCards?: Card[];
}

export interface HandHistory {
    handNumber: number;
    heroNetWon: number;        // Green Line: Total won/lost this hand
    heroShowdownWon: number;    // Blue Line: Won at showdown
    heroNonShowdownWon: number; // Red Line: Won without showdown
    heroAllInEV: number;        // Yellow Line: EV when all-in (0 if not all-in)
    finalPot: number;
    isShowdown: boolean;
    winnerIds: string[];
    heroCards: Card[];
    communityCards: Card[];
    actionLog: string[];
}

export interface GameState {
    id: string;
    phase: GamePhase;
    pot: number;
    communityCards: Card[];
    deck: Card[];
    players: Player[];
    activePlayerId: string; // ID of the player whose turn it is
    dealerIndex: number;
    smallBlindAmount: number;
    bigBlindAmount: number;
    minRaise: number;
    currentBet: number; // The amount to call
    winners?: string[]; // IDs of winners in showdown
    winnerInfo?: WinnerInfo; // Detailed winner information for display
    eliminatedPlayerIds: string[]; // Players who have been eliminated (0 chips)
    isGameOver: boolean; // True when only 1 player has chips
    handNumber: number; // Track how many hands have been played
    sessionHands: HandHistory[]; // Track all completed hands for session analysis
    currentHandLog: string[]; // Log of actions in the current hand
}
