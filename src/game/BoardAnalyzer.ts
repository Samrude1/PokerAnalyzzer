import { Card } from './Deck';

export interface BoardTexture {
    type: 'very-dry' | 'dry' | 'wet' | 'very-wet';
    score: number; // 0-100
    hasFlushDraw: boolean;
    hasFlush: boolean;
    hasStraightDraw: boolean;
    hasStraight: boolean;
    highCardRank: number;
}

export class BoardAnalyzer {
    static analyze(communityCards: Card[]): BoardTexture {
        if (communityCards.length === 0) {
            return {
                type: 'very-dry',
                score: 0,
                hasFlushDraw: false,
                hasFlush: false,
                hasStraightDraw: false,
                hasStraight: false,
                highCardRank: 0
            };
        }

        const suits = communityCards.map(c => c.suit);
        const ranks = communityCards.map(c => this.rankToVal(c.rank)).sort((a, b) => a - b);
        const highCardRank = ranks[ranks.length - 1];

        // 1. Analyze Flush Potential
        const suitCounts = suits.reduce((acc, suit) => {
            acc[suit] = (acc[suit] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const maxSuits = Math.max(...Object.values(suitCounts));
        const hasFlushDraw = maxSuits >= 3; // 3 to a flush on flop/turn counts as draw potential
        const hasFlush = maxSuits >= 5; // 5 to a flush (on board)

        // 2. Analyze Straight Potential (Connectivity)
        let gapScore = 0;
        let connectedCount = 1;
        let maxConnected = 1;
        let hasStraight = false;

        // Simple connectivity check
        // Check for 3-card or 4-card sequences
        // Also checks for gapped straights (1-gap)
        for (let i = 0; i < ranks.length - 1; i++) {
            const diff = ranks[i + 1] - ranks[i];
            if (diff === 0) continue; // Ignore pairs for straight calc
            if (diff === 1) {
                connectedCount++;
                maxConnected = Math.max(maxConnected, connectedCount);
            } else if (diff === 2) {
                // 1-gap
                gapScore += 5;
                connectedCount = 1; // Reset strict streak, but score gap
            } else {
                connectedCount = 1;
            }
        }

        // Special check for Wheel (A, 2, 3...)
        if (ranks.includes(14)) {
            // Check connectivity in [2,3,4,5]
            // Simplified: if we have 3 low cards + Ace, meaningful
        }

        const hasStraightDraw = maxConnected >= 3 || (maxConnected >= 2 && gapScore >= 5);
        hasStraight = maxConnected >= 5;

        // 3. Calculate Texture Score (0-100)
        let score = 0;

        // Suit Score
        if (hasFlush) score += 60;
        else if (hasFlushDraw) score += 30;
        else if (maxSuits === 2) score += 5; // 2-tone

        // Connectivity Score
        if (hasStraight) score += 50;
        else if (hasStraightDraw) score += 25;
        else if (gapScore > 0) score += 10;

        // High Card Score (Broadways connect better with ranges)
        const broadways = ranks.filter(r => r >= 10).length;
        score += broadways * 3;

        // Pair on board (Pair implies Full House potential, slightly wet but static)
        const pairCount = ranks.length - new Set(ranks).size;
        if (pairCount > 0) score += 10;

        // Normalize / Cap
        score = Math.min(score, 100);

        // Determine Type
        let type: BoardTexture['type'] = 'dry';
        if (score < 20) type = 'very-dry';
        else if (score < 45) type = 'dry';
        else if (score < 75) type = 'wet';
        else type = 'very-wet';

        return {
            type,
            score,
            hasFlushDraw,
            hasFlush,
            hasStraightDraw,
            hasStraight,
            highCardRank
        };
    }

    private static rankToVal(r: string): number {
        if (r === 'A') return 14;
        if (r === 'K') return 13;
        if (r === 'Q') return 12;
        if (r === 'J') return 11;
        if (r === 'T') return 10;
        return parseInt(r);
    }
}
