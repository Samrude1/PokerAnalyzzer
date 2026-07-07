import { Card } from '../Deck';

export class BotLogicUtils {
    static getRaiseToAmount(currentBet: number, minRaise: number, botStack: number): number {
        const multiplier = 2.2 + Math.random() * 0.3;
        const targetAmount = Math.floor(currentBet * multiplier);

        if (targetAmount > botStack * 0.4) {
            return botStack;
        }

        return Math.min(Math.max(targetAmount, minRaise), botStack);
    }

    static isPocketPair(cards: Card[]): boolean {
        return cards.length === 2 && cards[0].rank === cards[1].rank;
    }

    static isSuitedWheelAce(cards: Card[]): boolean {
        if (cards.length !== 2) return false;

        const c1 = cards[0];
        const c2 = cards[1];

        if (c1.suit !== c2.suit) return false;

        const ranks = [c1, c2].map(c => {
            if (c.rank === 'A') return 14;
            if (c.rank === '5') return 5;
            if (c.rank === '4') return 4;
            if (c.rank === '3') return 3;
            if (c.rank === '2') return 2;
            return 0;
        });

        const hasAce = ranks.includes(14);
        const hasWheelKicker = ranks.some(r => r >= 2 && r <= 5);

        return hasAce && hasWheelKicker;
    }

    static evaluatePreFlop(cards: Card[]): number {
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
}
