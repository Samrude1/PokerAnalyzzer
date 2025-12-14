import { describe, it, expect } from 'vitest';
import { BotLogic } from './BotLogic';
import { PokerGame } from './PokerGame';
import { Player, GameState } from './types';
import { Rank, Suit } from './Deck';

// Mock PokerGame to control state
const createMockGame = (
    currentBet: number,
    pot: number,
    botChips: number,
    botCurrentBet: number,
    phase: 'pre-flop' | 'flop' | 'turn' | 'river' = 'flop'
) => {
    const bot: Player = {
        id: 'bot-1',
        name: 'Bot',
        chips: botChips,
        initialChips: botChips,
        totalBuyIn: botChips,
        currentBet: botCurrentBet,
        cards: [], // Will be set in tests
        position: 'BTN',
        status: 'active',
        role: 'none',
        hasActed: false,
        lastAction: null,
        avatar: '',
        isHuman: false,
        handContribution: 0,
        stats: {
            handsPlayed: 0,
            handsWon: 0,
            vpipCount: 0,
            pfrCount: 0,
            threeBetCount: 0,
            threeBetOpportunity: 0,
            betsCount: 0,
            raisesCount: 0,
            callsCount: 0,
            showdownsReached: 0,
            showdownsWon: 0,
            sessionPnL: 0
        }
    };

    const gameState: GameState = {
        id: 'test-game',
        phase: phase,
        pot: pot,
        communityCards: [],
        deck: [],
        players: [bot],
        activePlayerId: bot.id,
        dealerIndex: 0,
        smallBlindAmount: 1,
        bigBlindAmount: 2,
        minRaise: 4,
        currentBet: currentBet,
        winners: [],
        handNumber: 1,
        eliminatedPlayerIds: [],
        isGameOver: false
    };

    const game = new PokerGame([bot]);
    game.state = gameState;

    return { game, bot };
};

describe('BotLogic Raise Sizing', () => {
    // Helper to give bot a strong hand
    const giveBotStrongHand = (bot: Player) => {
        bot.cards = [
            { rank: 'A' as Rank, suit: 'h' as Suit },
            { rank: 'K' as Rank, suit: 'h' as Suit }
        ];
        return [
            { rank: 'Q' as Rank, suit: 'h' as Suit },
            { rank: 'J' as Rank, suit: 'h' as Suit },
            { rank: 'T' as Rank, suit: 'h' as Suit }
        ];
    };

    it('should raise 2.2x - 2.5x when facing a normal bet post-flop', () => {
        // Stack 1000, Facing 50 (Pot 100)
        // Expected Raise: 50 * [2.2, 2.5] = [110, 125]
        const { game, bot } = createMockGame(50, 100, 1000, 0);
        game.state.communityCards = giveBotStrongHand(bot); // Royal Flush! Definitely raising.

        // Force a raise decision by ensuring bot Logic wants to raise
        // 50 call cost. 100 pot.
        const result = BotLogic.decide(game, bot);

        expect(result.action).toBe('raise');
        expect(result.amount).toBeGreaterThanOrEqual(110); // 2.2x
        expect(result.amount).toBeLessThanOrEqual(125);    // 2.5x (can be slightly more due to random, let's say 126)
    });

    it('should shove if the raise commits > 40% of stack (Post-flop)', () => {
        // Stack 1000, Facing 200 (Pot 500)
        // Standard Raise: 200 * 2.2 = 440. 200 * 2.5 = 500.
        // But logic says: const targetAmount = floor(currentBet * multiplier)
        // 440 is 44% of 1000.  > 40% -> Shove.
        const { game, bot } = createMockGame(200, 500, 1000, 0);
        game.state.communityCards = giveBotStrongHand(bot);

        const result = BotLogic.decide(game, bot);

        expect(result.action).toBe('raise');
        expect(result.amount).toBe(1000); // Shove
    });

    it('should NOT shove if deep stacked (Post-flop)', () => {
        // Stack 5000, Facing 200 (Pot 500)
        // Standard Raise: 200 * 2.2 = 440.
        // 440 is 8% of 5000 -> No shove.
        const { game, bot } = createMockGame(200, 500, 5000, 0);
        game.state.communityCards = giveBotStrongHand(bot);

        const result = BotLogic.decide(game, bot);

        expect(result.action).toBe('raise');
        expect(result.amount).toBeGreaterThanOrEqual(440);
        expect(result.amount).toBeLessThanOrEqual(510);
        expect(result.amount).not.toBe(5000);
    });

    it('should 4-bet raise pre-flop (but not shove deep)', () => {
        // Pre-flop logic
        // Facing 3-bet: > 6bb. BB=2. So > 12.
        // Let's set currentBet to 20.
        const { game, bot } = createMockGame(20, 30, 1000, 0, 'pre-flop');
        // Give AA
        bot.cards = [{ rank: 'A', suit: 'h' }, { rank: 'A', suit: 's' }];

        const result = BotLogic.decide(game, bot);

        expect(result.action).toBe('raise');
        // Expect 2.2x raise (approx 44)
        expect(result.amount).toBeGreaterThanOrEqual(44);
        expect(result.amount).toBeLessThanOrEqual(60);
    });
});

describe('Bot Strategy Differences', () => {
    it('Beginner should limp/call where Advanced might raise', () => {
        // Pre-flop, decent hand (ATo - Grade 5/6ish)
        const { game, bot } = createMockGame(2, 3, 1000, 0, 'pre-flop');
        bot.cards = [{ rank: 'A', suit: 'h' }, { rank: 'T', suit: 'd' }];

        // BEGINNER: Limp/Call
        bot.difficulty = 'beginner';
        const beginnerAction = BotLogic.decide(game, bot);
        expect(beginnerAction.action).toBe('call');

        // ADVANCED: Raise (Standard Open)
        bot.difficulty = 'advanced';
        const advancedAction = BotLogic.decide(game, bot);
        expect(advancedAction.action).toBe('raise');
    });

    it('Beginner should fold weak pair to aggression post-flop', () => {
        // Post-flop, weak pair (22 on K-7-2 board)
        // Facing big bet (100 into 150)
        const { game, bot } = createMockGame(100, 150, 1000, 0, 'flop');
        // Board: K 7 2
        game.state.communityCards = [
            { rank: 'K', suit: 's' },
            { rank: '7', suit: 'd' },
            { rank: '2', suit: 'c' }
        ];
        // Hand: A 2 (Bottom pair)
        bot.cards = [{ rank: 'A', suit: 'h' }, { rank: '2', suit: 'h' }];

        // BEGINNER: Folds weak pair to aggression > 10BB (BB=2, 100 > 20)
        bot.difficulty = 'beginner';
        const beginnerAction = BotLogic.decide(game, bot);
        // Wait, fit-or-fold logic says call if pair.
        // Let's check logic: "if (callCost > bb * 10 && rank < HandRank.TwoPair) return { action: 'fold' };"
        // callCost = 100. BB * 10 = 20. 100 > 20. Should fold.
        expect(beginnerAction.action).toBe('fold');
    });

    it('Intermediate should play tight pre-flop', () => {
        // Pre-flop, marginal hand (KTo)
        const { game, bot } = createMockGame(2, 3, 1000, 0, 'pre-flop');
        bot.cards = [{ rank: 'K', suit: 's' }, { rank: 'T', suit: 'h' }];
        bot.position = 'UTG'; // Early position requires stronger hand

        // INTERMEDIATE: Fold UTG
        bot.difficulty = 'intermediate';
        const intAction = BotLogic.decide(game, bot);
        expect(intAction.action).toBe('fold');

        // BEGINNER: Limp/Call
        bot.difficulty = 'beginner';
        const begAction = BotLogic.decide(game, bot);
        expect(begAction.action).toBe('call');
    });
});
