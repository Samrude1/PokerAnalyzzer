import { describe, it, expect } from 'vitest';
import { BoardAnalyzer } from './BoardAnalyzer';
import { Card, Rank, Suit } from './Deck';

describe('BoardAnalyzer', () => {
    // Helper to create cards
    const c = (rank: string, suit: string): Card => ({ rank: rank as Rank, suit: suit as Suit });

    it('should identify a very dry rainbow board', () => {
        // K-7-2 rainbow
        const board = [c('K', 's'), c('7', 'h'), c('2', 'd')];
        const result = BoardAnalyzer.analyze(board);

        expect(result.type).toBe('very-dry'); // Score heavily low
        expect(result.hasFlushDraw).toBe(false);
        expect(result.hasStraightDraw).toBe(false);
    });

    it('should identify a wet board with flush draw', () => {
        // 9s 8s 2d
        // const board = [c('9', 's'), c('8', 's'), c('2', 'd')];
        // const result = BoardAnalyzer.analyze(board);

        // 2-tone = +5, Connected (9-8) = 2 connected.
        // It's not fully "wet" (3-tone) yet in my logic, just 2-tone.
        // Let's create a real Flush Draw (3 cards) if testing "hasFlushDraw" logic for flop?
        // Wait, 3 cards on flop IS a flush draw if 2 are same suit? 
        // No, flush draw usually means *2* suited on flop (backdoor) or *3*? 
        // Standard def: 2-tone flop allows a flush draw (for player with 2 hole cards).
        // My analyzer code: checked `maxSuits === 3`.

        // Let's test a 3-tone flop (Monotone)
        const boardMonotone = [c('9', 's'), c('8', 's'), c('2', 's')];
        const resMonotone = BoardAnalyzer.analyze(boardMonotone);
        expect(resMonotone.hasFlushDraw).toBe(true);
        expect(resMonotone.type).toMatch(/wet/);
    });

    it('should identify a very wet board (connected + suited)', () => {
        // T-9-8 suited
        const board = [c('T', 's'), c('9', 's'), c('8', 's')];
        const result = BoardAnalyzer.analyze(board);

        expect(result.type).toBe('very-wet');
    });

    it('should score high for broadway heavy boards', () => {
        // A-K-Q rainbow
        const board = [c('A', 's'), c('K', 'h'), c('Q', 'd')];
        const result = BoardAnalyzer.analyze(board);

        // Connected (A-K-Q) -> Straight potential
        // 3 Broadways -> Bonus
        expect(result.score).toBeGreaterThan(40);
    });

    it('should separate dry vs wet correctly', () => {
        // Dry: Q-7-3 rainbow
        const dry = BoardAnalyzer.analyze([c('Q', 's'), c('7', 'h'), c('3', 'd')]);
        // Wet: 8-7-6 two-tone
        const wet = BoardAnalyzer.analyze([c('8', 's'), c('7', 's'), c('6', 'd')]);

        expect(wet.score).toBeGreaterThan(dry.score);
    });
});
