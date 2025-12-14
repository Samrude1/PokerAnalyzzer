import { Card, Rank } from './Deck';

export enum HandRank {
    HighCard = 0,
    Pair,
    TwoPair,
    ThreeOfAKind,
    Straight,
    Flush,
    FullHouse,
    FourOfAKind,
    StraightFlush,
    RoyalFlush
}

export interface HandResult {
    rank: HandRank;
    cards: Card[]; // The 5 cards that make up the hand
    description: string;
    value: number; // Numeric value for tie-breaking
}

const RANK_VALUES: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export class HandEvaluator {
    static evaluate(holeCards: Card[], communityCards: Card[]): HandResult {
        const allCards = [...holeCards, ...communityCards];
        // Sort by rank descending
        allCards.sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);

        // Check Flush
        const flush = this.getFlush(allCards);
        // Check Straight (and Straight Flush)
        const straight = this.getStraight(allCards); // Returns highest straight

        if (flush && straight) {
            // Check for Straight Flush
            // Filter cards to the flush suit
            const flushCards = allCards.filter(c => c.suit === flush.cards[0].suit);
            const straightFlush = this.getStraight(flushCards);
            if (straightFlush) {
                if (RANK_VALUES[straightFlush.cards[0].rank] === 14) {
                    return { rank: HandRank.RoyalFlush, cards: straightFlush.cards, description: "Royal Flush", value: 9000000 };
                }
                return { rank: HandRank.StraightFlush, cards: straightFlush.cards, description: "Straight Flush", value: 8000000 + RANK_VALUES[straightFlush.cards[0].rank] };
            }
        }

        const groups = this.groupCards(allCards);
        const quads = groups.filter(g => g.length === 4);
        const trips = groups.filter(g => g.length === 3);
        const pairs = groups.filter(g => g.length === 2);

        if (quads.length > 0) {
            const kicker = allCards.find(c => c.rank !== quads[0][0].rank)!;
            return {
                rank: HandRank.FourOfAKind,
                cards: [...quads[0], kicker],
                description: "Four of a Kind",
                value: 7000000 + RANK_VALUES[quads[0][0].rank] * 100 + RANK_VALUES[kicker.rank]
            };
        }

        if (trips.length > 0 && pairs.length > 0) {
            return {
                rank: HandRank.FullHouse,
                cards: [...trips[0], ...pairs[0]],
                description: "Full House",
                value: 6000000 + RANK_VALUES[trips[0][0].rank] * 100 + RANK_VALUES[pairs[0][0].rank]
            };
        }

        if (trips.length >= 2) {
            // Technically possible with 7 cards (two sets of trips).
            // Higher trips is the "Three", lower trips becomes the "Pair" (Top 2 cards).
            return {
                rank: HandRank.FullHouse,
                cards: [...trips[0], trips[1][0], trips[1][1]],
                description: "Full House",
                value: 6000000 + RANK_VALUES[trips[0][0].rank] * 100 + RANK_VALUES[trips[1][0].rank]
            };
        }

        if (flush) {
            let val = 5000000;
            flush.cards.forEach((c, i) => val += RANK_VALUES[c.rank] * Math.pow(15, 4 - i));
            return { rank: HandRank.Flush, cards: flush.cards, description: "Flush", value: val };
        }

        if (straight) {
            return { rank: HandRank.Straight, cards: straight.cards, description: "Straight", value: 4000000 + RANK_VALUES[straight.cards[0].rank] };
        }

        if (trips.length > 0) {
            const kickers = allCards.filter(c => c.rank !== trips[0][0].rank).slice(0, 2);
            return {
                rank: HandRank.ThreeOfAKind,
                cards: [...trips[0], ...kickers],
                description: `Three of a Kind`,
                value: 3000000 + RANK_VALUES[trips[0][0].rank] * 1000 + RANK_VALUES[kickers[0].rank] * 15 + RANK_VALUES[kickers[1].rank]
            };
        }

        if (pairs.length >= 2) {
            const kicker = allCards.filter(c => c.rank !== pairs[0][0].rank && c.rank !== pairs[1][0].rank)[0];
            return {
                rank: HandRank.TwoPair,
                cards: [...pairs[0], ...pairs[1], kicker],
                description: "Two Pair",
                value: 2000000 + RANK_VALUES[pairs[0][0].rank] * 1000 + RANK_VALUES[pairs[1][0].rank] * 15 + RANK_VALUES[kicker.rank]
            };
        }

        if (pairs.length === 1) {
            const kickers = allCards.filter(c => c.rank !== pairs[0][0].rank).slice(0, 3);
            let val = 1000000 + RANK_VALUES[pairs[0][0].rank] * 10000;
            kickers.forEach((c, i) => val += RANK_VALUES[c.rank] * Math.pow(15, 2 - i));

            return {
                rank: HandRank.Pair,
                cards: [...pairs[0], ...kickers],
                description: "Pair",
                value: val
            };
        }

        const highCards = allCards.slice(0, 5);
        let val = 0;
        highCards.forEach((c, i) => val += RANK_VALUES[c.rank] * Math.pow(15, 4 - i));
        return { rank: HandRank.HighCard, cards: highCards, description: "High Card", value: val };
    }

    private static getFlush(cards: Card[]): { cards: Card[] } | null {
        const suits: Record<string, Card[]> = { h: [], d: [], c: [], s: [] };
        cards.forEach(c => suits[c.suit].push(c));

        for (const suit in suits) {
            if (suits[suit].length >= 5) {
                // Already sorted by Rank descending
                return { cards: suits[suit].slice(0, 5) };
            }
        }
        return null;
    }

    private static getStraight(cards: Card[]): { cards: Card[] } | null {
        // Unique ranks
        const unique = cards.filter((c, i, self) =>
            i === self.findIndex(t => t.rank === c.rank)
        );

        // Handle Ace low straight (A, 5, 4, 3, 2)
        // Add minimal Ace if Ace exists
        if (unique[0].rank === 'A') {
            // Check for 5,4,3,2
            // Actually, simplest way is to check consecutive
        }

        // Naive consecutive check
        for (let i = 0; i <= unique.length - 5; i++) {
            const subset = unique.slice(i, i + 5);
            if (this.isConsecutive(subset)) return { cards: subset };
        }

        // Check Ace Low (A, 5, 4, 3, 2)
        // A is at index 0 (value 14). 5,4,3,2 are at the end if present.
        const ace = unique.find(c => c.rank === 'A');
        const lowVals = ['5', '4', '3', '2'];
        if (ace) {
            const lows = unique.filter(c => lowVals.includes(c.rank));
            if (lows.length === 4 && lows[0].rank === '5' && lows[3].rank === '2') {
                // Found A-5-4-3-2 Straight. 5-high.
                // Remember to return the 5-high cards, not Ace high (Ace counts as 1)
                // Or rather, standard order: 5, 4, 3, 2, A
                return { cards: [...lows, ace] };
            }
        }

        return null;
    }

    private static isConsecutive(cards: Card[]): boolean {
        for (let i = 0; i < 4; i++) {
            if (RANK_VALUES[cards[i].rank] - RANK_VALUES[cards[i + 1].rank] !== 1) return false;
        }
        return true;
    }

    private static groupCards(cards: Card[]): Card[][] {
        const map: Record<string, Card[]> = {};
        cards.forEach(c => {
            if (!map[c.rank]) map[c.rank] = [];
            map[c.rank].push(c);
        });
        const groups = Object.values(map);
        // Sort groups by size desc, then rank desc
        groups.sort((a, b) => {
            if (b.length !== a.length) return b.length - a.length;
            return RANK_VALUES[b[0].rank] - RANK_VALUES[a[0].rank];
        });
        return groups;
    }
}
