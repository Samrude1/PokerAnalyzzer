import { describe, it, expect } from 'vitest';
import { HandEvaluator, HandRank } from './HandEvaluator';
import { Card } from './Deck';

// Helper to create cards from string (e.g. "Ah", "Ks")
const c = (str: string): Card => ({
    rank: str[0] as any,
    suit: str[1] as any
});

describe('HandEvaluator', () => {
    it('identifies High Card', () => {
        const hole = [c('Ah'), c('7d')];
        const comm = [c('2s'), c('4c'), c('9h'), c('Qd'), c('5s')];
        const result = HandEvaluator.evaluate(hole, comm);
        expect(result.rank).toBe(HandRank.HighCard);
        // A, Q, 9, 7, 5
    });

    it('identifies Pair', () => {
        const hole = [c('Ah'), c('7d')];
        const comm = [c('As'), c('4c'), c('9h'), c('Qd'), c('5s')];
        const result = HandEvaluator.evaluate(hole, comm);
        expect(result.rank).toBe(HandRank.Pair);
    });

    it('identifies Two Pair', () => {
        const hole = [c('Ah'), c('7d')];
        const comm = [c('As'), c('7c'), c('9h'), c('Qd'), c('5s')];
        const result = HandEvaluator.evaluate(hole, comm);
        expect(result.rank).toBe(HandRank.TwoPair);
    });

    it('identifies Three of a Kind', () => {
        const hole = [c('Ah'), c('Ad')];
        const comm = [c('As'), c('7c'), c('9h'), c('Qd'), c('5s')];
        const result = HandEvaluator.evaluate(hole, comm);
        expect(result.rank).toBe(HandRank.ThreeOfAKind);
    });

    it('identifies Straight', () => {
        const hole = [c('9h'), c('8d')];
        const comm = [c('7s'), c('6c'), c('5h'), c('Kd'), c('2s')];
        const result = HandEvaluator.evaluate(hole, comm);
        expect(result.rank).toBe(HandRank.Straight);
    });

    it('identifies Flush', () => {
        const hole = [c('Ah'), c('Th')];
        const comm = [c('2h'), c('5h'), c('9h'), c('Kd'), c('Qs')];
        const result = HandEvaluator.evaluate(hole, comm);
        expect(result.rank).toBe(HandRank.Flush);
    });

    it('identifies Full House', () => {
        const hole = [c('Ah'), c('Ad')];
        const comm = [c('As'), c('Kd'), c('Ks'), c('Qd'), c('5s')];
        const result = HandEvaluator.evaluate(hole, comm);
        expect(result.rank).toBe(HandRank.FullHouse);
    });

    it('identifies Four of a Kind', () => {
        const hole = [c('Ah'), c('Ad')];
        const comm = [c('As'), c('Ac'), c('Ks'), c('Qd'), c('5s')];
        const result = HandEvaluator.evaluate(hole, comm);
        expect(result.rank).toBe(HandRank.FourOfAKind);
    });

    it('identifies Straight Flush', () => {
        const hole = [c('9h'), c('8h')];
        const comm = [c('7h'), c('6h'), c('5h'), c('Kd'), c('2s')];
        const result = HandEvaluator.evaluate(hole, comm);
        expect(result.rank).toBe(HandRank.StraightFlush);
    });

    it('identifies Royal Flush', () => {
        const hole = [c('Ah'), c('Kh')];
        const comm = [c('Qh'), c('Jh'), c('Th'), c('Kd'), c('2s')];
        const result = HandEvaluator.evaluate(hole, comm);
        expect(result.rank).toBe(HandRank.RoyalFlush);
    });

    it('correctly values higher hands', () => {
        const pairA = HandEvaluator.evaluate([c('Ah'), c('Ad')], [c('2s'), c('3d'), c('4c'), c('5h'), c('7s')]);
        const pairK = HandEvaluator.evaluate([c('Kh'), c('Kd')], [c('2s'), c('3d'), c('4c'), c('5h'), c('7s')]);
        expect(pairA.value).toBeGreaterThan(pairK.value);
    });
});
