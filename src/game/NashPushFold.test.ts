import { describe, it, expect } from 'vitest';
import { NashPushFold } from './NashPushFold';
import { Card } from './Deck';

describe('NashPushFold Unit Tests', () => {
    describe('Hand Notation Formatting', () => {
        it('formats pocket pairs correctly', () => {
            const cards: Card[] = [
                { rank: 'K', suit: 's' },
                { rank: 'K', suit: 'd' }
            ];
            expect(NashPushFold.getHandNotation(cards)).toBe('KK');
        });

        it('formats suited connectors correctly', () => {
            const cards: Card[] = [
                { rank: '9', suit: 'h' },
                { rank: 'T', suit: 'h' }
            ];
            expect(NashPushFold.getHandNotation(cards)).toBe('T9s');
        });

        it('formats offsuit hands with high card first', () => {
            const cards: Card[] = [
                { rank: '4', suit: 'c' },
                { rank: 'A', suit: 'd' }
            ];
            expect(NashPushFold.getHandNotation(cards)).toBe('A4o');
        });
    });

    describe('Nash Push Threshold Lookups', () => {
        it('AA is always push 50+ BB from any position', () => {
            expect(NashPushFold.getThreshold('AA', 'UTG')).toBe(50);
            expect(NashPushFold.getThreshold('AA', 'BTN')).toBe(50);
            expect(NashPushFold.getThreshold('AA', 'SB')).toBe(50);
        });

        it('suited connectors push deeper from Button than UTG', () => {
            const btnMax = NashPushFold.getThreshold('98s', 'BTN');
            const utgMax = NashPushFold.getThreshold('98s', 'UTG');
            expect(btnMax).toBeGreaterThan(utgMax);
            expect(btnMax).toBe(10.5);
            expect(utgMax).toBe(3.2);
        });

        it('weak unsuited trash pushes only at tiny stacks', () => {
            expect(NashPushFold.getThreshold('72o', 'BTN')).toBeLessThanOrEqual(1.5);
        });
    });

    describe('Push / Fold Evaluations', () => {
        it('evaluates a correct shove with A5s on Button with 12 BB', () => {
            const cards: Card[] = [
                { rank: 'A', suit: 's' },
                { rank: '5', suit: 's' }
            ];
            // BTN threshold for A5s is 16 BB. 12 <= 16 -> PUSH
            const result = NashPushFold.evaluate(cards, 'BTN', 12);
            expect(result.isPush).toBe(true);
            expect(result.verdict).toBe('PUSH');
            expect(result.maxBB).toBe(16);
            expect(result.explanation).toContain('PUSH');
        });

        it('evaluates a fold with K6o in UTG with 10 BB', () => {
            const cards: Card[] = [
                { rank: 'K', suit: 's' },
                { rank: '6', suit: 'd' }
            ];
            // UTG threshold for K6o is 1.0 BB. 10 > 1.0 -> FOLD
            const result = NashPushFold.evaluate(cards, 'UTG', 10);
            expect(result.isPush).toBe(false);
            expect(result.verdict).toBe('FOLD');
            expect(result.explanation).toContain('FOLD');
        });
    });

    describe('Drill Generator & Matrix Provider', () => {
        it('generates a valid training scenario', () => {
            const scenario = NashPushFold.generateScenario('medium');
            expect(scenario).toHaveProperty('id');
            expect(scenario.heroCards).toHaveLength(2);
            expect(['PUSH', 'FOLD']).toContain(scenario.correctAction);
            expect(scenario.stackBB).toBeGreaterThan(0);
            expect(scenario.maxBB).toBeGreaterThan(0);
        });

        it('provides complete 13x13 matrix', () => {
            const matrix = NashPushFold.getMatrix();
            expect(matrix).toHaveLength(13);
            expect(matrix[0]).toHaveLength(13);

            // Diagonal is pocket pairs
            expect(matrix[0][0].name).toBe('AA');
            expect(matrix[0][0].type).toBe('pair');

            // Top-right is suited
            expect(matrix[0][1].name).toBe('AKs');
            expect(matrix[0][1].type).toBe('suited');

            // Bottom-left is offsuit
            expect(matrix[1][0].name).toBe('AKo');
            expect(matrix[1][0].type).toBe('offsuit');
        });
    });
});
