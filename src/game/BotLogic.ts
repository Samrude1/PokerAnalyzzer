import { Player } from './types';
import { PokerGame } from './PokerGame';
import { HandEvaluator, HandRank } from './HandEvaluator';
import { BoardAnalyzer } from './BoardAnalyzer';
import { OpponentProfiler } from './OpponentProfiler';
import { BotLogicUtils } from './bot/BotLogicUtils';
import { BotStrategy, BotAction } from './bot/BotStrategy';

export class BeginnerStrategy implements BotStrategy {
    decidePreFlop(bot: Player, game: PokerGame, callCost: number, canCheck: boolean): BotAction {
        const grade = BotLogicUtils.evaluatePreFlop(bot.cards);
        const bb = game.state.bigBlindAmount;

        if (grade >= 8 && callCost < bb * 6) {
            const minRaise = game.state.minRaise;
            const totalStack = bot.chips + bot.currentBet;
            const raiseAmt = Math.min(Math.max(bb * 3, minRaise), totalStack);
            return { action: 'raise', amount: raiseAmt };
        }

        if (grade >= 2 || Math.random() < 0.3) {
            if (callCost > bb * 8 && grade < 5) return { action: 'fold' };
            return { action: 'call' };
        }

        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
    }

    decidePostFlop(bot: Player, game: PokerGame, callCost: number, canCheck: boolean, _pot: number): BotAction {
        const handResult = HandEvaluator.evaluate(bot.cards, game.state.communityCards);
        const rank = handResult.rank;
        const bb = game.state.bigBlindAmount;

        if (rank >= HandRank.Pair) {
            if (rank >= HandRank.TwoPair && canCheck && Math.random() < 0.3) {
                const minRaise = game.state.minRaise;
                const totalStack = bot.chips + bot.currentBet;
                return { action: 'raise', amount: Math.min(minRaise, totalStack) };
            }
            if (callCost > bb * 15 && rank < HandRank.TwoPair) return { action: 'fold' }; 
            return { action: 'call' };
        }

        if (callCost > 0 && callCost <= bb * 5) {
            if (Math.random() < 0.4) return { action: 'call' };
        }
        
        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
    }
}

export class IntermediateStrategy implements BotStrategy {
    decidePreFlop(bot: Player, game: PokerGame, callCost: number, canCheck: boolean): BotAction {
        const grade = BotLogicUtils.evaluatePreFlop(bot.cards);
        const bb = game.state.bigBlindAmount;
        const currentBet = game.state.currentBet;
        const totalStack = bot.chips + bot.currentBet;
        const position = bot.position || 'UTG';

        const threshold = (position === 'UTG' || position === 'HJ') ? 6 : 4;

        if (grade >= threshold) {
            const raiseAmt = Math.min(game.state.minRaise + bb, totalStack);
            if (callCost > bb * 5 && grade < 10) return { action: 'fold' };
            if (currentBet > bb) return { action: 'call' };
            return { action: 'raise', amount: raiseAmt };
        }

        if (grade >= 3 && grade <= 5 && callCost < bb * 3 && BotLogicUtils.isPocketPair(bot.cards)) {
            return { action: 'call' };
        }

        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
    }

    decidePostFlop(bot: Player, game: PokerGame, callCost: number, canCheck: boolean, pot: number): BotAction {
        const handResult = HandEvaluator.evaluate(bot.cards, game.state.communityCards);
        const rank = handResult.rank;
        const totalStack = bot.chips + bot.currentBet;
        const minRaise = game.state.minRaise;

        if (rank >= HandRank.TwoPair) {
            const betSize = Math.floor(pot * 0.75);
            const validRaise = Math.max(betSize, minRaise);
            return { action: 'raise', amount: Math.min(validRaise, totalStack) };
        }

        if (rank === HandRank.Pair) {
            if (callCost > pot * 0.7) return { action: 'fold' };
            if (canCheck) return { action: 'check' };
            return { action: 'call' };
        }

        const texture = BoardAnalyzer.analyze(game.state.communityCards);
        if (canCheck && texture.type === 'dry' && Math.random() < 0.6) {
            const cBet = Math.floor(pot * 0.5);
            const validRaise = Math.max(cBet, minRaise);
            return { action: 'raise', amount: Math.min(validRaise, totalStack) };
        }

        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
    }
}

export class AdvancedStrategy implements BotStrategy {
    decidePreFlop(bot: Player, game: PokerGame, callCost: number, canCheck: boolean): BotAction {
        const bb = game.state.bigBlindAmount;
        const currentBet = game.state.currentBet;
        const minRaise = game.state.minRaise;
        let grade = BotLogicUtils.evaluatePreFlop(bot.cards);
        const position = bot.position || 'UTG';
        const isLatePosition = position === 'BTN' || position === 'CO';

        const isSuitedWheelAce = BotLogicUtils.isSuitedWheelAce(bot.cards);

        const facingRaise = currentBet > bb;
        const facing3Bet = currentBet > bb * 6 && currentBet <= bb * 15;
        const facing4Bet = currentBet > bb * 15;

        let villainType: 'Nit' | 'TAG' | 'LAG' | 'Fish' | 'Unknown' = 'Unknown';
        if (facingRaise) {
            const raiser = game.state.players.find(p => p.currentBet === currentBet && p.id !== bot.id && p.status !== 'folded');
            if (raiser) {
                villainType = OpponentProfiler.classify(raiser);
                if (villainType === 'Nit') grade -= 2;
                else if (villainType === 'LAG' || villainType === 'Fish') grade += 1;
            }
        }

        const playersInPot = game.state.players.filter(p => p.currentBet > 0 && p.status !== 'folded').length;
        const multiWayPot = playersInPot >= 3;

        const isBlind = position === 'SB' || position === 'BB';
        const openMult = isBlind ? 3 : 2.5;
        const standardOpenAmount = Math.floor(bb * openMult);
        const totalStack = bot.chips + bot.currentBet;

        const safeRaise = (amount: number) => Math.min(Math.max(amount, minRaise), totalStack);
        const threeBetSize = (raise: number) => Math.floor(raise * (isLatePosition ? 3 : 4));
        const fourBetSize = (raise: number) => Math.floor(raise * (isLatePosition ? 2.2 : 2.5));
        const fiveBetSize = (raise: number) => {
            const calculated = Math.floor(raise * 2.2);
            return calculated > totalStack * 0.4 ? totalStack : calculated;
        };

        const isShortStack = (bot.chips / bb) < 20;
        if (isShortStack) {
            if (grade >= 8) return { action: 'raise', amount: totalStack };
            if (grade >= 6 && isLatePosition) return { action: 'raise', amount: totalStack };
            if (grade >= 5 && isLatePosition) return { action: 'raise', amount: totalStack };
            if (canCheck) return { action: 'check' };
            return { action: 'fold' };
        }

        if (grade >= 10) {
            if (facing4Bet) return { action: 'raise', amount: safeRaise(fiveBetSize(currentBet)) };
            if (facing3Bet) return { action: 'raise', amount: safeRaise(fourBetSize(currentBet)) };
            if (facingRaise) return { action: 'raise', amount: safeRaise(threeBetSize(currentBet)) };
            return { action: 'raise', amount: safeRaise(standardOpenAmount) };
        }

        if (grade >= 7) {
            if (facing4Bet) {
                if (grade >= 9) return { action: 'call' };
                return { action: 'fold' };
            }
            if (facing3Bet) {
                if (villainType === 'Nit') return { action: 'fold' };
                if (villainType === 'LAG') return { action: 'call' };
                if (multiWayPot) return { action: 'fold' };
                return { action: 'call' };
            }
            if (facingRaise) {
                if (villainType === 'Fish') return { action: 'raise', amount: safeRaise(Math.floor(currentBet * 4)) };
                if (Math.random() < 0.5) return { action: 'raise', amount: safeRaise(threeBetSize(currentBet)) };
                return { action: 'call' };
            }
            return { action: 'raise', amount: safeRaise(standardOpenAmount) };
        }

        const threshold = position === 'UTG' ? 5 : 4;
        if (grade >= threshold) {
            if (facing3Bet) return { action: 'fold' };
            if (facingRaise) {
                if (villainType === 'Nit') return { action: 'fold' };
                if (isLatePosition || position === 'BB') {
                    if (callCost < bb * 4) return { action: 'call' };
                }
                return { action: 'fold' };
            }
            return { action: 'raise', amount: safeRaise(standardOpenAmount) };
        }

        const specThreshold = isLatePosition ? 4 : 5;
        if (isSuitedWheelAce && facingRaise && !facing3Bet && villainType !== 'Nit') {
            if (isLatePosition && Math.random() < 0.4) return { action: 'raise', amount: safeRaise(threeBetSize(currentBet)) };
        }

        if (grade >= specThreshold) {
            if (facingRaise) {
                if (villainType === 'Fish' && callCost < bb * 4) return { action: 'call' };
                if (position === 'BB' && callCost < bb * 3) return { action: 'call' };
                if (grade >= 3 && grade <= 5 && callCost < bb * 3 && bot.chips > bb * 50) return { action: 'call' };
                return { action: 'fold' };
            }
            if (isLatePosition && !facingRaise) return { action: 'raise', amount: safeRaise(standardOpenAmount) };
            if (canCheck) return { action: 'check' };
            return { action: 'fold' };
        }

        if (canCheck) return { action: 'check' };
        return { action: 'fold' };
    }

    decidePostFlop(bot: Player, game: PokerGame, callCost: number, canCheck: boolean, pot: number): BotAction {
        const handResult = HandEvaluator.evaluate(bot.cards, game.state.communityCards);
        const rank = handResult.rank;
        const minRaise = game.state.minRaise;
        const phase = game.state.phase;
        const currentBet = game.state.currentBet;
        const totalStack = bot.chips + bot.currentBet;

        const facingBet = callCost > 0;
        const bigBet = callCost > pot * 0.6;
        const smallBet = callCost < pot * 0.35;

        let villainType: 'Nit' | 'TAG' | 'LAG' | 'Fish' | 'Unknown' = 'Unknown';
        let villainEstimatedRange: 'Air' | 'Weak' | 'Medium' | 'Strong' | 'Monster' | 'Unknown' = 'Unknown';
        
        if (facingBet) {
            const aggr = game.state.players.find(p => p.currentBet === currentBet && p.id !== bot.id);
            if (aggr) villainType = OpponentProfiler.classify(aggr);

            if (villainType === 'Nit') villainEstimatedRange = bigBet ? 'Monster' : 'Strong';
            else if (villainType === 'Fish') villainEstimatedRange = bigBet ? 'Strong' : 'Weak';
            else if (villainType === 'LAG') villainEstimatedRange = bigBet ? (Math.random() < 0.3 ? 'Air' : 'Monster') : 'Medium';
            else villainEstimatedRange = bigBet ? 'Strong' : 'Medium';
        }

        const texture = BoardAnalyzer.analyze(game.state.communityCards);
        const { type } = texture;

        const betPot = (fraction: number) => {
            let mult = villainType === 'Fish' ? 1.2 : 1.0;
            const size = Math.floor(pot * fraction * mult);
            return Math.min(Math.max(size, minRaise), totalStack);
        };

        const getRaiseAmount = () => BotLogicUtils.getRaiseToAmount(currentBet, minRaise, totalStack);

        const position = bot.position || 'UTG';
        const inPosition = position === 'BTN' || position === 'CO';

        if (rank >= HandRank.Straight) {
            if (facingBet) {
                if (villainType === 'LAG' && phase !== 'river' && Math.random() < 0.4) return { action: 'call' };
                if (phase === 'river' && Math.random() < 0.2) return { action: 'call' };
                return { action: 'raise', amount: getRaiseAmount() };
            }
            let betSize = (type === 'very-wet' || type === 'wet') ? 0.8 : (type === 'very-dry' ? 0.33 : 0.66);
            return { action: 'raise', amount: betPot(betSize) };
        }

        if (rank >= HandRank.TwoPair) {
            if (facingBet) {
                if (bigBet && (type === 'wet' || type === 'very-wet')) {
                    if (villainEstimatedRange === 'Monster' && rank === HandRank.TwoPair) return { action: 'fold' };
                    return Math.random() < 0.6 ? { action: 'call' } : { action: 'raise', amount: getRaiseAmount() };
                }
                return { action: 'raise', amount: getRaiseAmount() };
            }
            const size = (type === 'wet' || type === 'very-wet') ? 0.75 : 0.45;
            return { action: 'raise', amount: betPot(size) };
        }

        if (rank === HandRank.Pair) {
            if (facingBet) {
                if (villainEstimatedRange === 'Monster') return { action: 'fold' };
                if (villainEstimatedRange === 'Air' || villainEstimatedRange === 'Weak') return { action: 'call' };
                if (bigBet) {
                    if (type === 'very-wet') return { action: 'fold' };
                    if (villainEstimatedRange === 'Strong' && (phase === 'turn' || phase === 'river')) return { action: 'fold' };
                    return Math.random() < 0.4 ? { action: 'call' } : { action: 'fold' };
                }
                return { action: 'call' };
            }

            if (phase === 'flop') {
                let cBetFreq = 0.5, cBetSize = 0.5;
                if (type === 'very-dry') { cBetFreq = 0.85; cBetSize = 0.33; }
                else if (type === 'dry') { cBetFreq = 0.70; cBetSize = 0.45; }
                else if (type === 'wet') { cBetFreq = 0.40; cBetSize = 0.66; }
                else { cBetFreq = 0.20; cBetSize = 0.75; }

                if (villainType === 'Nit') cBetFreq += 0.15;
                if (villainType === 'Fish') cBetFreq = 0.95;

                if (Math.random() < cBetFreq) return { action: 'raise', amount: betPot(cBetSize) };
                return { action: 'check' };
            }

            if (Math.random() < 0.5) return { action: 'raise', amount: betPot(0.5) };
            return { action: 'check' };
        }

        if (canCheck) {
            let bluffFreq = inPosition ? 0.35 : 0.20;
            if (type === 'very-dry') bluffFreq += 0.15;
            if (type === 'wet') bluffFreq -= 0.10;
            if (villainType === 'Nit') bluffFreq += 0.20;
            if (villainType === 'Fish') bluffFreq = 0;

            if (Math.random() < bluffFreq) {
                const size = (type === 'dry' || type === 'very-dry') ? 0.33 : 0.6;
                return { action: 'raise', amount: betPot(size) };
            }
            return { action: 'check' };
        }

        if (smallBet && inPosition && Math.random() < 0.25 && villainType !== 'Fish') return { action: 'call' };

        if (phase !== 'river' && facingBet && smallBet && Math.random() < 0.2) {
            if (villainType === 'Fish') return { action: 'call' };
            return { action: 'raise', amount: getRaiseAmount() };
        }

        return { action: 'fold' };
    }
}

export class ProStrategy extends AdvancedStrategy {
    decidePreFlop(bot: Player, game: PokerGame, callCost: number, canCheck: boolean): BotAction {
        const bb = game.state.bigBlindAmount;
        const currentBet = game.state.currentBet;
        const grade = BotLogicUtils.evaluatePreFlop(bot.cards);
        const facingRaise = currentBet > bb;
        const position = bot.position || 'UTG';
        const isLatePosition = position === 'BTN' || position === 'CO';

        const decision = super.decidePreFlop(bot, game, callCost, canCheck);

        if (facingRaise && decision.action === 'fold') {
            if (grade >= 3 && isLatePosition && Math.random() < 0.40) {
                const threeBet = Math.max(game.state.minRaise, Math.floor(currentBet * 3));
                return { action: 'raise', amount: Math.min(threeBet, bot.chips + bot.currentBet) };
            }
        }

        if (!facingRaise && decision.action === 'fold') {
            const threshold = isLatePosition ? 2 : 4;
            if (grade >= threshold) {
                const standardOpenAmount = Math.floor(bb * 2.5);
                return { action: 'raise', amount: Math.min(Math.max(standardOpenAmount, game.state.minRaise), bot.chips + bot.currentBet) };
            }
        }

        return decision;
    }

    decidePostFlop(bot: Player, game: PokerGame, callCost: number, canCheck: boolean, pot: number): BotAction {
        const decision = super.decidePostFlop(bot, game, callCost, canCheck, pot);
        const phase = game.state.phase;

        if (phase === 'river' && decision.action === 'fold') {
            if (canCheck && Math.random() < 0.15) {
                const totalStack = bot.chips + bot.currentBet;
                return { action: 'raise', amount: totalStack };
            }
        }

        if (phase === 'flop' && decision.action === 'fold' && callCost < pot * 0.6) {
            if (Math.random() < 0.20) return { action: 'call' };
        }

        return decision;
    }
}

export class BotLogic {
    static decide(game: PokerGame, bot: Player): BotAction {
        const gameState = game.state;
        const currentBet = gameState.currentBet;
        const callCost = currentBet - bot.currentBet;
        const pot = gameState.pot;
        const bb = gameState.bigBlindAmount;
        const canCheck = callCost === 0;

        const difficulty = bot.difficulty || 'advanced';
        
        let strategy: BotStrategy;
        switch (difficulty) {
            case 'beginner': strategy = new BeginnerStrategy(); break;
            case 'intermediate': strategy = new IntermediateStrategy(); break;
            case 'pro': strategy = new ProStrategy(); break;
            case 'advanced': 
            default: 
                strategy = new AdvancedStrategy(); break;
        }

        let decision = gameState.phase === 'pre-flop' 
            ? strategy.decidePreFlop(bot, game, callCost, canCheck)
            : strategy.decidePostFlop(bot, game, callCost, canCheck, pot);

        // Push/Fold Override for short stacks preflop (SBR awareness)
        const stackInBBs = bot.chips / bb;
        if (gameState.phase === 'pre-flop' && stackInBBs <= 15) {
            const grade = BotLogicUtils.evaluatePreFlop(bot.cards);
            const totalStack = bot.chips + bot.currentBet;
            const position = bot.position || 'UTG';
            
            let pushThreshold = 7;
            if (position === 'BTN' || position === 'SB' || position === 'CO') pushThreshold -= 2;
            if (stackInBBs <= 8) pushThreshold -= 2;
            
            if (grade >= pushThreshold) decision = { action: 'raise', amount: totalStack };
            else if (callCost > 0) decision = { action: 'fold' };
            else decision = { action: 'check' };
        }

        if (decision.action === 'call' && callCost === 0) {
            return { action: 'check' };
        }
        return decision;
    }
}
