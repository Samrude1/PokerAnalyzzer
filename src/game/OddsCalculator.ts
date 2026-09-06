import { Card, Rank } from './Deck';

export interface DrawInfo {
    name: string;
    outs: number;
    description: string;
}

export interface OddsAnalysis {
    potOddsPercent: number;
    callAmount: number;
    totalPotAfterCall: number;
    draws: DrawInfo[];
    totalOuts: number;
    drawEquityPercent: number;
    isProfitableCall: boolean;
    recommendation: string;
}

const RANK_VALUES: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export class OddsCalculator {
    /**
     * Calculates the Pot Odds as a percentage required to break even on a call:
     * Pot Odds = Call Amount / (Current Pot + Current Bets + Call Amount)
     */
    static calculatePotOdds(callAmount: number, currentPot: number): number {
        if (callAmount <= 0) return 0;
        const totalPot = currentPot + callAmount;
        if (totalPot <= 0) return 0;
        return Math.round((callAmount / totalPot) * 1000) / 10;
    }

    /**
     * Estimates draw equity using the Rule of 4 and 2:
     * - Flop to river (with 2 cards to come): ~ outs * 4 (adjusted for large out counts)
     * - Turn to river (with 1 card to come): ~ outs * 2.17
     */
    static calculateDrawEquity(outs: number, street: 'flop' | 'turn'): number {
        if (outs <= 0) return 0;
        if (street === 'turn') {
            const equity = Math.min(outs * 2.17, 100);
            return Math.round(equity * 10) / 10;
        } else {
            // Flop to river
            let equity = outs * 4;
            if (outs > 8) {
                // Rule of 4 correction for high outs
                equity -= (outs - 8);
            }
            return Math.round(Math.min(equity, 100) * 10) / 10;
        }
    }

    /**
     * Analyzes Hero hole cards and community cards to detect common draws & outs
     */
    static analyzeDraws(holeCards: Card[], communityCards: Card[]): DrawInfo[] {
        if (holeCards.length !== 2 || communityCards.length < 3) {
            return [];
        }

        const draws: DrawInfo[] = [];
        const allCards = [...holeCards, ...communityCards];

        // 1. Flush Draw Detection (4 cards of same suit)
        const suitCounts: Record<string, number> = { 's': 0, 'h': 0, 'd': 0, 'c': 0 };
        allCards.forEach(c => {
            if (suitCounts[c.suit] !== undefined) suitCounts[c.suit]++;
        });

        const suitNames: Record<string, string> = {
            s: 'Spades',
            h: 'Hearts',
            d: 'Diamonds',
            c: 'Clubs'
        };

        for (const [suit, count] of Object.entries(suitCounts)) {
            // If 4 cards of suit, 9 cards of that suit remain
            if (count === 4) {
                // Ensure hero holds at least 1 card of that suit
                const heroHasSuit = holeCards.some(c => c.suit === suit);
                if (heroHasSuit) {
                    draws.push({
                        name: 'Flush Draw',
                        outs: 9,
                        description: `4 to a ${suitNames[suit] || suit} flush (9 outs)`
                    });
                }
            }
        }

        // 2. Straight Draw Detection (Open-Ended or Gutshot)
        const uniqueRankValues = Array.from(
            new Set(allCards.map(c => RANK_VALUES[c.rank]))
        ).sort((a, b) => a - b);

        // Include Ace as 1 for wheel straights (A-2-3-4-5)
        if (uniqueRankValues.includes(14)) {
            uniqueRankValues.unshift(1);
        }

        let hasOESD = false;
        let hasGutshot = false;

        // Check 4-card windows spanning a width of 4 or 5
        // Open-ended: 4 consecutive numbers (e.g., 5-6-7-8, where 4 or 9 completes it, width = 3, outs = 8)
        // Gutshot: 4 cards with 1 inside gap (e.g. 5-7-8-9 or 5-6-8-9, width = 4, outs = 4)
        for (let i = 0; i < uniqueRankValues.length - 3; i++) {
            const v1 = uniqueRankValues[i];
            const v2 = uniqueRankValues[i + 1];
            const v3 = uniqueRankValues[i + 2];
            const v4 = uniqueRankValues[i + 3];

            // Check for 4 consecutive numbers (Open-Ended)
            if (v4 - v1 === 3 && v3 - v1 === 2 && v2 - v1 === 1) {
                // An open-ended draw cannot be bounded by the Ace extremes (A-2-3-4 is gutshot with only 5, J-Q-K-A is gutshot with only 10)
                if (v1 > 1 && v4 < 14) {
                    hasOESD = true;
                } else {
                    hasGutshot = true;
                }
            } else if (v4 - v1 === 4) {
                // Span of 5 with 4 distinct ranks = inside straight / gutshot
                hasGutshot = true;
            }
        }

        if (hasOESD) {
            draws.push({
                name: 'Open-Ended Straight Draw',
                outs: 8,
                description: 'Open-ended straight draw (8 outs)'
            });
        } else if (hasGutshot) {
            draws.push({
                name: 'Gutshot Straight Draw',
                outs: 4,
                description: 'Inside / gutshot straight draw (4 outs)'
            });
        }

        // 3. Overcards Detection (Hero hole cards strictly higher than all board cards)
        if (draws.length === 0) {
            const maxBoardRank = Math.max(...communityCards.map(c => RANK_VALUES[c.rank]));
            const overcards = holeCards.filter(c => RANK_VALUES[c.rank] > maxBoardRank);
            if (overcards.length > 0) {
                const outs = overcards.length * 3;
                draws.push({
                    name: `${overcards.length} Overcard${overcards.length > 1 ? 's' : ''}`,
                    outs: outs,
                    description: `${overcards.map(c => c.rank).join(', ')} overcard(s) to the board (${outs} outs)`
                });
            }
        }

        return draws;
    }

    /**
     * Performs a complete odds and strategic EV analysis when Hero faces a bet
     */
    static analyzeFullOdds(
        holeCards: Card[],
        communityCards: Card[],
        callAmount: number,
        currentPot: number,
        street: 'flop' | 'turn' | 'river'
    ): OddsAnalysis {
        const potOdds = this.calculatePotOdds(callAmount, currentPot);
        const totalPotAfterCall = currentPot + callAmount;

        if (street === 'river' || communityCards.length < 3) {
            return {
                potOddsPercent: potOdds,
                callAmount,
                totalPotAfterCall,
                draws: [],
                totalOuts: 0,
                drawEquityPercent: 0,
                isProfitableCall: potOdds <= 25, // River bluff-catch baseline
                recommendation: potOdds > 0 ? `Need >${potOdds}% showdown win rate to call` : 'No bet to call'
            };
        }

        const effectiveStreet = communityCards.length === 3 ? 'flop' : 'turn';
        const draws = this.analyzeDraws(holeCards, communityCards);

        // Sum outs, handling combo draw discount if both flush & straight exist
        let totalOuts = draws.reduce((acc, d) => acc + d.outs, 0);
        if (draws.some(d => d.name === 'Flush Draw') && draws.some(d => d.name.includes('Straight'))) {
            // Discount 2 overlapping straight cards that share the flush suit
            totalOuts = Math.max(totalOuts - 2, 9);
        }

        const drawEquity = this.calculateDrawEquity(totalOuts, effectiveStreet);
        const isProfitable = callAmount === 0 || drawEquity >= potOdds;

        let recommendation = '';
        if (callAmount === 0) {
            recommendation = 'Free check available (Check or Bet for value/protection)';
        } else if (drawEquity >= potOdds) {
            recommendation = `+EV Call: Draw equity (${drawEquity}%) exceeds pot odds (${potOdds}%)!`;
        } else if (drawEquity > 0) {
            recommendation = `-EV Call: Pot odds (${potOdds}%) too expensive for draw equity (${drawEquity}%). Fold unless implied odds are massive.`;
        } else {
            recommendation = `Pot odds: ${potOdds}%. Call only if holding a made hand beating villain's range.`;
        }

        return {
            potOddsPercent: potOdds,
            callAmount,
            totalPotAfterCall,
            draws,
            totalOuts,
            drawEquityPercent: drawEquity,
            isProfitableCall: isProfitable,
            recommendation
        };
    }
}
