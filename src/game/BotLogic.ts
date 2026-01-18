import { Player, Position } from './types';
import { PokerGame } from './PokerGame';
import { HandEvaluator, HandRank } from './HandEvaluator';
import { Card } from './Deck';
import { BoardAnalyzer } from './BoardAnalyzer';
import { OpponentProfiler } from './OpponentProfiler';

/**
 * Advanced 6-max NL Hold'em Bot AI
 * Based on modern 6-max cash game strategy:
 * - Position-based opening ranges (tight UTG, wider BTN)
 * - Polarized 3-betting (value + bluffs)
 * - Board texture awareness (wet vs dry)
 * - Continuation betting strategy
 * - Floating and delayed c-bets
 * - Stack-depth adjustments
 */
export class BotLogic {
    static decide(game: PokerGame, bot: Player): { action: 'fold' | 'check' | 'call' | 'raise', amount?: number } {
        const gameState = game.state;
        const currentBet = gameState.currentBet;
        const callCost = currentBet - bot.currentBet;
        const pot = gameState.pot;
        const bb = gameState.bigBlindAmount;

        const canCheck = callCost === 0;

        const effectiveStack = bot.chips;
        const stackInBBs = effectiveStack / bb;
        const isShortStack = stackInBBs < 20;
        const isDeepStack = stackInBBs > 150;

        const position = bot.position || 'UTG';
        const isLatePosition = position === 'BTN' || position === 'CO';
        const difficulty = bot.difficulty || 'advanced';

        let decision;
        if (gameState.phase === 'pre-flop') {
            switch (difficulty) {
                case 'beginner':
                    decision = this.beginnerPreflopDecision(bot, game, callCost, canCheck);
                    break;
                case 'intermediate':
                    decision = this.intermediatePreflopDecision(bot, game, position, callCost, canCheck);
                    break;
                case 'advanced':
                    decision = this.advancedPreflopDecision(bot, game, position, isShortStack, isLatePosition, callCost, canCheck);
                    break;
                case 'pro':
                    decision = this.proPreflopDecision(bot, game, position, isShortStack, isLatePosition, callCost, canCheck);
                    break;
                default:
                    decision = this.advancedPreflopDecision(bot, game, position, isShortStack, isLatePosition, callCost, canCheck);
                    break;
            }
        } else {
            switch (difficulty) {
                case 'beginner':
                    decision = this.beginnerPostflopDecision(bot, game, callCost, canCheck);
                    break;
                case 'intermediate':
                    decision = this.intermediatePostflopDecision(bot, game, callCost, canCheck, pot);
                    break;
                case 'advanced':
                    decision = this.advancedPostflopDecision(bot, game, callCost, canCheck, pot, isDeepStack);
                    break;
                case 'pro':
                    decision = this.proPostflopDecision(bot, game, callCost, canCheck, pot, isDeepStack);
                    break;
                default:
                    decision = this.advancedPostflopDecision(bot, game, callCost, canCheck, pot, isDeepStack);
                    break;
            }
        }

        // Fix: If decision is 'call' but cost is 0, means 'check'
        if (decision.action === 'call' && callCost === 0) {
            return { action: 'check' };
        }
        return decision;
    }

    private static getRaiseToAmount(currentBet: number, minRaise: number, botStack: number): number {
        // GTO Standard Open: 2.2x - 2.5x
        const multiplier = 2.2 + Math.random() * 0.3; // 2.2x - 2.5x
        const targetAmount = Math.floor(currentBet * multiplier);

        // Stack Commitment Logic -> if committing > 40% of stack, shove
        if (targetAmount > botStack * 0.4) {
            return botStack;
        }

        return Math.min(Math.max(targetAmount, minRaise), botStack);
    }

    // ==========================================
    // BEGINNER STRATEGY
    // ==========================================
    // Passive, plays too many hands, calls too much

    private static beginnerPreflopDecision(
        bot: Player,
        _game: PokerGame,
        callCost: number,
        canCheck: boolean
    ): { action: 'fold' | 'check' | 'call' | 'raise', amount?: number } {
        const grade = this.evaluatePreFlop(bot.cards);
        const bb = _game.state.bigBlindAmount;

        // Only raises with absolute premiums (Grade 10+)
        if (grade >= 10 && callCost < bb * 4) {
            const minRaise = _game.state.minRaise;
            const totalStack = bot.chips + bot.currentBet;
            const raiseAmt = Math.min(Math.max(bb * 3, minRaise), totalStack);
            return { action: 'raise', amount: raiseAmt };
        }

        // Limps/Calls with almost anything playable (Grade 3+)
        if (grade >= 3) {
            if (callCost > bb * 5) return { action: 'fold' }; // Folds to big raises
            return { action: 'call' };
        }

        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
    }

    private static beginnerPostflopDecision(
        bot: Player,
        game: PokerGame,
        callCost: number,
        canCheck: boolean
    ): { action: 'fold' | 'check' | 'call' | 'raise', amount?: number } {
        const handResult = HandEvaluator.evaluate(bot.cards, game.state.communityCards);
        const rank = handResult.rank;
        const bb = game.state.bigBlindAmount;

        // "Fit or Fold" - Call if made a pair
        if (rank >= HandRank.Pair) {
            // Min-raise with Two Pair+ for "value" (often bad sizing)
            if (rank >= HandRank.TwoPair && canCheck && Math.random() < 0.5) {
                const minRaise = game.state.minRaise;
                const totalStack = bot.chips + bot.currentBet;
                return { action: 'raise', amount: Math.min(minRaise, totalStack) };
            }
            if (callCost > bb * 10 && rank < HandRank.TwoPair) return { action: 'fold' }; // Fold weak pair to huge bet
            return { action: 'call' };
        }

        // Chases draws passively
        const texture = BoardAnalyzer.analyze(game.state.communityCards);
        if (texture.type === 'wet' && callCost < bb * 4) {
            return { action: 'call' };
        }

        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
    }

    // ==========================================
    // INTERMEDIATE STRATEGY (TAG / NIT)
    // ==========================================
    // Tight preflop, straightforward postflop.

    private static isPocketPair(cards: Card[]): boolean {
        return cards.length === 2 && cards[0].rank === cards[1].rank;
    }

    private static intermediatePreflopDecision(
        bot: Player,
        game: PokerGame,
        position: Position,
        callCost: number,
        canCheck: boolean
    ): { action: 'fold' | 'check' | 'call' | 'raise', amount?: number } {
        const grade = this.evaluatePreFlop(bot.cards);
        const bb = game.state.bigBlindAmount;
        const currentBet = game.state.currentBet;
        const totalStack = bot.chips + bot.currentBet;

        // Tight opening ranges
        // Tight opening ranges (slightly loosened)
        const threshold = (position === 'UTG' || position === 'HJ') ? 6 : 4;

        if (grade >= threshold) {
            const raiseAmt = Math.min(game.state.minRaise + bb, totalStack); // Simple 3x-ish raise

            // If facing large raise (3-bet), fold non-premiums
            if (callCost > bb * 5 && grade < 10) return { action: 'fold' };

            if (currentBet > bb) return { action: 'call' }; // Just calls raises usually
            return { action: 'raise', amount: raiseAmt };
        }

        // Set mining - ONLY with pairs
        if (grade >= 3 && grade <= 5 && callCost < bb * 3 && this.isPocketPair(bot.cards)) {
            return { action: 'call' };
        }

        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
    }

    private static intermediatePostflopDecision(
        bot: Player,
        game: PokerGame,
        callCost: number,
        canCheck: boolean,
        pot: number
    ): { action: 'fold' | 'check' | 'call' | 'raise', amount?: number } {
        const handResult = HandEvaluator.evaluate(bot.cards, game.state.communityCards);
        const rank = handResult.rank;
        const totalStack = bot.chips + bot.currentBet;
        const minRaise = game.state.minRaise;

        // Value bets strong hands
        if (rank >= HandRank.TwoPair) {
            const betSize = Math.floor(pot * 0.75);
            const validRaise = Math.max(betSize, minRaise);
            return { action: 'raise', amount: Math.min(validRaise, totalStack) };
        }

        // Top Pair: Call or small bet
        if (rank === HandRank.Pair) {
            // Need to check if it's top pair ideally, but for now treat all pairs as playable
            if (callCost > pot * 0.7) return { action: 'fold' }; // Folds to big pressure
            if (canCheck) return { action: 'check' }; // Checks back often
            return { action: 'call' };
        }

        // C-bet dry boards occasionally
        const texture = BoardAnalyzer.analyze(game.state.communityCards);
        // More aggressive on dry boards
        if (canCheck && texture.type === 'dry' && Math.random() < 0.6) {
            const cBet = Math.floor(pot * 0.5);
            const validRaise = Math.max(cBet, minRaise);
            return { action: 'raise', amount: Math.min(validRaise, totalStack) };
        }

        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
    }


    // ==========================================
    // ADVANCED STRATEGY (Existing Logic)
    // ==========================================

    private static advancedPreflopDecision(
        bot: Player,
        game: PokerGame,
        position: Position,
        isShortStack: boolean,
        isLatePosition: boolean,
        callCost: number,
        canCheck: boolean
    ): { action: 'fold' | 'check' | 'call' | 'raise', amount?: number } {
        const bb = game.state.bigBlindAmount;
        const currentBet = game.state.currentBet;
        const minRaise = game.state.minRaise;
        const grade = this.evaluatePreFlop(bot.cards);

        // Check for specific bluff candidates (A2s-A5s)
        const isSuitedWheelAce = this.isSuitedWheelAce(bot.cards);

        const facingRaise = currentBet > bb;
        const facing3Bet = currentBet > bb * 6 && currentBet <= bb * 15;
        const facing4Bet = currentBet > bb * 15;

        // --- OPPONENT PROFILING UPDATE ---
        let villainType: 'Nit' | 'TAG' | 'LAG' | 'Fish' | 'Unknown' = 'Unknown';
        if (facingRaise) {
            // Find potential aggressor (simplification: assume player with matching max bet)
            const raiser = game.state.players.find(p => p.currentBet === currentBet && p.id !== bot.id && p.status !== 'folded');
            if (raiser) {
                villainType = OpponentProfiler.classify(raiser);
            }
        }

        // Count number of players who have acted
        const playersInPot = game.state.players.filter(p =>
            p.currentBet > 0 && p.status !== 'folded'
        ).length;
        const multiWayPot = playersInPot >= 3;

        // Open raise sizes: 2.5x Standard, 3x from SB or BB
        const isBlind = position === 'SB' || position === 'BB';
        const openMult = isBlind ? 3 : 2.5;
        const standardOpenAmount = Math.floor(bb * openMult);

        const totalStack = bot.chips + bot.currentBet;

        // Helper to bounds check raise
        const safeRaise = (amount: number) => Math.min(Math.max(amount, minRaise), totalStack);

        // 3-bet sizing: 3x IP, 4x OOP
        const threeBetSize = (raise: number) => {
            const multiplier = isLatePosition ? 3 : 4;
            return Math.floor(raise * multiplier);
        };

        // 4-bet sizing: 2.2x-2.5x the 3-bet
        const fourBetSize = (raise: number) => {
            const multiplier = isLatePosition ? 2.2 : 2.5;
            return Math.floor(raise * multiplier);
        };

        // 5-bet sizing: Often a shove, but can be ~2.2x the 4-bet if deep
        const fiveBetSize = (raise: number) => {
            // If 5-bet would be more than 40% of stack, just shove
            const calculated = Math.floor(raise * 2.2);
            return calculated > totalStack * 0.4 ? totalStack : calculated;
        };

        // Short stack: Push/Fold
        if (isShortStack) {
            if (grade >= 8) return { action: 'raise', amount: totalStack };
            if (grade >= 6 && isLatePosition) return { action: 'raise', amount: totalStack };
            if (grade >= 5 && isShortStack && isLatePosition) return { action: 'raise', amount: totalStack }; // Wider shove late
            if (canCheck) return { action: 'check' };
            return { action: 'fold' };
        }

        // ===== PREMIUM (AA, KK, QQ, AKs) - Grade 10+ =====
        if (grade >= 10) {
            if (facing4Bet) {
                // 5-bet with premium hands
                const fiveBet = fiveBetSize(currentBet);
                return { action: 'raise', amount: safeRaise(fiveBet) };
            }
            if (facing3Bet) {
                // 4-bet with premium hands
                const fourBet = fourBetSize(currentBet);
                return { action: 'raise', amount: safeRaise(fourBet) };
            }
            if (facingRaise) {
                // VS NIT: Still raise for value, but maybe respect their range implies we are tied/behind if they shove
                const threeBet = threeBetSize(currentBet);
                return { action: 'raise', amount: safeRaise(threeBet) };
            }
            return { action: 'raise', amount: safeRaise(standardOpenAmount) };
        }

        // ===== STRONG (JJ, TT, AK, AQs) - Grade 7+ =====
        if (grade >= 7) {
            if (facing4Bet) {
                if (grade >= 9) return { action: 'call' }; // Call AK/QQ
                return { action: 'fold' };
            }
            if (facing3Bet) {
                // VS NIT: Fold JJ/TT/AQ to a 3-bet from a Nit
                if (villainType === 'Nit') return { action: 'fold' };
                // VS LAG: Call wider
                if (villainType === 'LAG') return { action: 'call' };

                if (multiWayPot) return { action: 'fold' };
                return { action: 'call' };
            }
            if (facingRaise) {
                // VS FISH: Isolate Raise!
                if (villainType === 'Fish') {
                    const isoSize = Math.floor(currentBet * 4); // Big ISO to isolate the fish
                    return { action: 'raise', amount: safeRaise(isoSize) };
                }

                // Mix 3-bet/Call
                if (Math.random() < 0.5) {
                    const threeBet = threeBetSize(currentBet);
                    return { action: 'raise', amount: safeRaise(threeBet) };
                }
                return { action: 'call' };
            }
            const raiseAmt = standardOpenAmount;
            return { action: 'raise', amount: safeRaise(raiseAmt) };
        }

        // ===== PLAYABLE (99-66, AJ, KQ, Suited Broadways) - Grade 5+ =====
        // Adjusted: UTG needs Grade 6+, others 5+
        // ===== PLAYABLE (99-66, AJ, KQ, Suited Broadways) - Grade 5+ =====
        // Adjusted: UTG needs Grade 5+, others 4+ (Loosened)
        const threshold = position === 'UTG' ? 5 : 4;

        if (grade >= threshold) {
            if (facing3Bet) return { action: 'fold' };
            if (facingRaise) {
                // VS NIT: Fold dominated hands (AJ, KQ) against a tight opener
                if (villainType === 'Nit') return { action: 'fold' };

                // Defend IP or Big Blind
                if (isLatePosition || position === 'BB') {
                    if (callCost < bb * 4) return { action: 'call' };
                }
                return { action: 'fold' };
            }
            // Open Raise
            const raiseAmt = standardOpenAmount;
            return { action: 'raise', amount: safeRaise(raiseAmt) };
        }

        // ===== SPECULATIVE & BLUFFS (Small pairs, Connectors, A2s-A5s) - Grade 3+ =====
        // Late position can open wider (Grade 4+)
        const specThreshold = isLatePosition ? 4 : 5;

        // 3-Bet Bluff Logic: A2s-A5s (Suited Wheel Aces)
        if (isSuitedWheelAce && facingRaise && !facing3Bet) {
            // VS NIT: Never bluff a Nit
            if (villainType !== 'Nit') {
                // 3-bet bluff frequency (Increased)
                if (isLatePosition && Math.random() < 0.4) {
                    const threeBet = threeBetSize(currentBet);
                    return { action: 'raise', amount: safeRaise(threeBet) };
                }
            }
        }

        if (grade >= specThreshold) {
            if (facingRaise) {
                // VS FISH: Over-limp / Call speculative hands to crack them with implied odds
                if (villainType === 'Fish' && callCost < bb * 4) {
                    return { action: 'call' };
                }

                // Defend BB with wide range
                if (position === 'BB' && callCost < bb * 3) return { action: 'call' };
                // Set mine if deep
                if (grade >= 3 && grade <= 5 && callCost < bb * 3 && bot.chips > bb * 50) return { action: 'call' };
                return { action: 'fold' };
            }

            // Steal from late position
            if (isLatePosition && !facingRaise) {
                const raiseAmt = standardOpenAmount;
                return { action: 'raise', amount: safeRaise(raiseAmt) };
            }
            if (canCheck) return { action: 'check' };
            return { action: 'fold' };
        }

        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
    }

    private static advancedPostflopDecision(
        bot: Player,
        game: PokerGame,
        callCost: number,
        canCheck: boolean,
        pot: number,
        _isDeepStack: boolean
    ): { action: 'fold' | 'check' | 'call' | 'raise', amount?: number } {
        const handResult = HandEvaluator.evaluate(bot.cards, game.state.communityCards);
        const rank = handResult.rank;
        const minRaise = game.state.minRaise;
        const phase = game.state.phase;
        const currentBet = game.state.currentBet;
        const totalStack = bot.chips + bot.currentBet;

        // --- OPPONENT PROFILING ---
        let villainType: 'Nit' | 'TAG' | 'LAG' | 'Fish' | 'Unknown' = 'Unknown';
        // Simplistic assumption: Villain is the one who bet/raised if we are facing a bet
        // If checking, villain is the remaining active player(s) - simplified to generic 'Unknown' if multiway or check
        if (callCost > 0) {
            const aggr = game.state.players.find(p => p.currentBet === currentBet && p.id !== bot.id);
            if (aggr) villainType = OpponentProfiler.classify(aggr);
        }
        // --------------------------

        // Board texture analysis
        const texture = BoardAnalyzer.analyze(game.state.communityCards);
        const { type } = texture;

        const betPot = (fraction: number) => {
            let mult = 1.0;
            // Adjust sizing vs Fish
            if (villainType === 'Fish') mult = 1.2; // Bet bigger for value vs Fish

            const size = Math.floor(pot * fraction * mult);
            return Math.min(Math.max(size, minRaise), totalStack);
        };

        const getRaiseAmount = () => {
            return this.getRaiseToAmount(currentBet, minRaise, totalStack);
        };

        const facingBet = callCost > 0;
        const bigBet = callCost > pot * 0.6;
        const smallBet = callCost < pot * 0.35;

        // Position awareness
        const position = bot.position || 'UTG';
        const inPosition = position === 'BTN' || position === 'CO';

        // ===== MONSTER (Straight+) =====
        if (rank >= HandRank.Straight) {
            if (facingBet) {
                // Raise for value
                // VS LAG: Slowplay/Trap more often?
                if (villainType === 'LAG' && phase !== 'river' && Math.random() < 0.4) return { action: 'call' };

                if (phase === 'river' && Math.random() < 0.2) return { action: 'call' }; // Trap
                return { action: 'raise', amount: getRaiseAmount() };
            }

            // Texture-based sizing
            let betSize = 0.66;
            if (type === 'very-wet' || type === 'wet') betSize = 0.8;
            else if (type === 'very-dry') betSize = 0.33;

            return { action: 'raise', amount: betPot(betSize) };
        }

        // ===== STRONG (Two Pair, Set) =====
        if (rank >= HandRank.TwoPair) {
            if (facingBet) {
                if (bigBet && (type === 'wet' || type === 'very-wet')) {
                    // scary board
                    // VS NIT: If a Nit bets big on a wet board, they have the straight/flush often. Fold bottom 2 pair.
                    if (villainType === 'Nit' && rank === HandRank.TwoPair) return { action: 'fold' };

                    return Math.random() < 0.6 ? { action: 'call' } : { action: 'raise', amount: getRaiseAmount() };
                }
                return { action: 'raise', amount: getRaiseAmount() };
            }

            // Value bet sizing
            const size = (type === 'wet' || type === 'very-wet') ? 0.75 : 0.45;
            return { action: 'raise', amount: betPot(size) };
        }

        // ===== MEDIUM (Top Pair, Overpair) =====
        if (rank === HandRank.Pair) {
            if (facingBet) {
                if (bigBet) {
                    if (type === 'very-wet') return { action: 'fold' };

                    // VS NIT: Fold Top Pair to big bets on Turn/River. They have 2-pair+.
                    if (villainType === 'Nit' && (phase === 'turn' || phase === 'river')) return { action: 'fold' };

                    // VS FISH: Call. They overvalue everything.
                    if (villainType === 'Fish') return { action: 'call' };

                    return Math.random() < 0.4 ? { action: 'call' } : { action: 'fold' };
                }
                return { action: 'call' };
            }

            // C-bet strategy
            if (phase === 'flop') {
                let cBetFreq = 0.5;
                let cBetSize = 0.5;

                if (type === 'very-dry') {
                    cBetFreq = 0.85;
                    cBetSize = 0.33;
                } else if (type === 'dry') {
                    cBetFreq = 0.70;
                    cBetSize = 0.45;
                } else if (type === 'wet') {
                    cBetFreq = 0.40;
                    cBetSize = 0.66;
                } else { // very-wet
                    cBetFreq = 0.20;
                    cBetSize = 0.75;
                }

                // VS NIT: C-bet frequency can be higher (they fold weak pairs)
                if (villainType === 'Nit') cBetFreq += 0.15;
                // VS CALLING STATION (Fish): Don't bluff, but this is value with Top Pair, so bet freq remains or increases?
                // Actually if Fish calls everything, we MUST bet top pair for value.
                if (villainType === 'Fish') cBetFreq = 0.95;

                if (Math.random() < cBetFreq) {
                    return { action: 'raise', amount: betPot(cBetSize) };
                }
                return { action: 'check' };
            }

            // Turn/river
            if (Math.random() < 0.5) {
                return { action: 'raise', amount: betPot(0.5) };
            }
            return { action: 'check' };
        }

        // ===== WEAK (High Card, Draws) =====
        if (canCheck) {
            // Bluffing Frequency
            let bluffFreq = inPosition ? 0.35 : 0.20;

            // Adjust bluff freq by texture
            if (type === 'very-dry') bluffFreq += 0.15;
            if (type === 'wet') bluffFreq -= 0.10;

            // VS NIT: Bluff MORE. They fold unless hit.
            if (villainType === 'Nit') bluffFreq += 0.20;

            // VS FISH: Bluff LESS (or NEVER). They call too much.
            if (villainType === 'Fish') bluffFreq = 0; // Pure value exploit

            const shouldBluff = Math.random() < bluffFreq;

            if (shouldBluff) {
                const size = (type === 'dry' || type === 'very-dry') ? 0.33 : 0.6;
                return { action: 'raise', amount: betPot(size) };
            }
            return { action: 'check' };
        }

        // Float
        if (smallBet && inPosition && Math.random() < 0.25 && villainType !== 'Fish') {
            return { action: 'call' };
        }

        // Semi-bluff draws
        if (phase !== 'river' && facingBet && smallBet && Math.random() < 0.2) {
            // VS FISH: Don't raise draws (semi-bluff), just call to hit.
            if (villainType === 'Fish') return { action: 'call' };
            return { action: 'raise', amount: getRaiseAmount() };
        }

        return { action: 'fold' };
    }

    private static evaluatePreFlop(cards: Card[]): number {
        if (cards.length !== 2) return 0;

        const rankToVal = (r: string) => {
            if (r === 'A') return 14;
            if (r === 'K') return 13;
            if (r === 'Q') return 12;
            if (r === 'J') return 11;
            if (r === 'T') return 10;
            return parseInt(r);
        };

        const v1 = rankToVal(cards[0].rank);
        const v2 = rankToVal(cards[1].rank);
        const suited = cards[0].suit === cards[1].suit;
        const pair = v1 === v2;

        if (pair) {
            if (v1 >= 13) return 12; // AA, KK
            if (v1 >= 12) return 10; // QQ
            if (v1 >= 10) return 8;  // JJ, TT
            if (v1 >= 7) return 5;   // 77-99
            return 3;                 // 22-66
        }

        const high = Math.max(v1, v2);
        const low = Math.min(v1, v2);
        const gap = high - low;
        const connected = gap === 1;

        if (high === 14) {
            if (low === 13) return suited ? 11 : 10; // AK
            if (low === 12) return suited ? 9 : 7;   // AQ
            if (low === 11) return suited ? 8 : 6;   // AJ
            if (low === 10) return suited ? 7 : 5;   // AT
            if (suited) return 4;
            return 2;
        }

        if (high === 13) {
            if (low >= 11) return suited ? 7 : 5;
            if (low === 10) return suited ? 6 : 4;
            if (suited) return 3;
            return 1;
        }

        if (high >= 10 && low >= 10) return suited ? 6 : 4;
        if (suited && connected && high >= 5) return 4;
        if (suited && gap <= 2 && high >= 6) return 3;
        if (suited) return 2;
        if (connected && high >= 6) return 2;

        return 1;
    }

    // ==========================================
    // PRO STRATEGY (LAG - Loose Aggressive)
    // ==========================================
    // Wider preflop ranges, aggressive 3-betting, frequent semi-bluffs.

    private static proPreflopDecision(
        bot: Player,
        game: PokerGame,
        position: Position,
        isShortStack: boolean,
        isLatePosition: boolean,
        callCost: number,
        canCheck: boolean
    ): { action: 'fold' | 'check' | 'call' | 'raise', amount?: number } {
        const bb = game.state.bigBlindAmount;
        const currentBet = game.state.currentBet;
        const grade = this.evaluatePreFlop(bot.cards);
        const facingRaise = currentBet > bb;

        // LAGs play wider ranges, especially in late position
        let playedGrade = grade;
        if (isLatePosition) playedGrade += 1; // Artificially boost grade for late pos

        // Use advanced logic as base, but modify behavior
        const decision = this.advancedPreflopDecision(bot, game, position, isShortStack, isLatePosition, callCost, canCheck);

        // LAG TWEAKS:

        // 1. 3-Bet Bluff more often
        if (facingRaise && decision.action === 'fold') {
            // If hand is somewhat playable (Grade 3+) and we are in position
            if (grade >= 3 && isLatePosition && Math.random() < 0.40) { // Increased to 40%
                // Turn a fold into a 3-bet bluff
                const threeBet = Math.max(game.state.minRaise, Math.floor(currentBet * 3));
                return { action: 'raise', amount: Math.min(threeBet, bot.chips + bot.currentBet) };
            }
        }

        // 2. Open wider from CO/BTN
        if (!facingRaise && decision.action === 'fold' && isLatePosition) {
            // Open ALMOST ANYTHING playable (Grade 2+)
            if (grade >= 2) {
                const standardOpenAmount = Math.floor(bb * 2.5);
                return { action: 'raise', amount: Math.min(Math.max(standardOpenAmount, game.state.minRaise), bot.chips + bot.currentBet) };
            }
        }

        return decision;
    }

    private static proPostflopDecision(
        bot: Player,
        game: PokerGame,
        callCost: number,
        canCheck: boolean,
        pot: number,
        isDeepStack: boolean
    ): { action: 'fold' | 'check' | 'call' | 'raise', amount?: number } {
        // Base decision
        const decision = this.advancedPostflopDecision(bot, game, callCost, canCheck, pot, isDeepStack);
        const handResult = HandEvaluator.evaluate(bot.cards, game.state.communityCards);
        const rank = handResult.rank;
        const phase = game.state.phase;

        // LAG TWEAKS:

        // 1. Triple Barrel Bluff Potential (River Jam)
        // If we have nothing but missed draw, and action is fold
        if (phase === 'river' && decision.action === 'fold') {
            // Only if we showed aggression previously? (Hard to track without history, but random aggression works for now)
            if (canCheck && Math.random() < 0.15) { // 15% River bluff shove
                const totalStack = bot.chips + bot.currentBet;
                return { action: 'raise', amount: totalStack };
            }
        }

        // 2. Float Flop C-bets in position with Air
        if (phase === 'flop' && decision.action === 'fold' && callCost < pot * 0.6) {
            if (Math.random() < 0.20) {
                return { action: 'call' };
            }
        }

        return decision;
    }

    private static isSuitedWheelAce(cards: Card[]): boolean {
        if (cards.length !== 2) return false;

        const c1 = cards[0];
        const c2 = cards[1];

        // Must be suited
        if (c1.suit !== c2.suit) return false;

        const ranks = [c1, c2].map(c => {
            if (c.rank === 'A') return 14;
            if (c.rank === '5') return 5;
            if (c.rank === '4') return 4;
            if (c.rank === '3') return 3;
            if (c.rank === '2') return 2;
            return 0;
        });

        // Must contain Ace (14) and 2-5
        const hasAce = ranks.includes(14);
        const hasWheelKicker = ranks.some(r => r >= 2 && r <= 5);

        return hasAce && hasWheelKicker;
    }
}
