import { describe, it, expect } from 'vitest';
import { OddsCalculator } from './OddsCalculator';
import { Card } from './Deck';

describe('OddsCalculator Unit Tests', () => {
    describe('Pot Odds Calculations', () => {
        it('calculates pot odds correctly', () => {
            // Bet 50 into 150 (Total pot after call = 200, hero calls 50 -> 25%)
            const potOdds = OddsCalculator.calculatePotOdds(50, 150);
            expect(potOdds).toBe(25);
        });

        it('returns 0 when no call amount', () => {
            expect(OddsCalculator.calculatePotOdds(0, 100)).toBe(0);
        });

        it('calculates half-pot bet odds correctly', () => {
            // Pot is 100, opponent bets 50 (pot now 150). Hero calls 50. Total pot 200 -> 25%
            const potOdds = OddsCalculator.calculatePotOdds(50, 150);
            expect(potOdds).toBe(25);
        });
    });

    describe('Draw Equity Calculations (Rule of 4 and 2)', () => {
        it('calculates flush draw equity on flop (9 outs * 4 - 1 = ~35%)', () => {
            const equity = OddsCalculator.calculateDrawEquity(9, 'flop');
            expect(equity).toBeGreaterThanOrEqual(34);
            expect(equity).toBeLessThanOrEqual(36);
        });

        it('calculates flush draw equity on turn (9 outs * 2.17 = ~19.5%)', () => {
            const equity = OddsCalculator.calculateDrawEquity(9, 'turn');
            expect(equity).toBeGreaterThanOrEqual(19);
            expect(equity).toBeLessThanOrEqual(20);
        });

        it('calculates gutshot equity on turn (4 outs * 2.17 = ~8.7%)', () => {
            const equity = OddsCalculator.calculateDrawEquity(4, 'turn');
            expect(equity).toBe(8.7);
        });
    });

    describe('Draw Detection', () => {
        it('detects flush draws correctly', () => {
            const heroCards: Card[] = [
                { rank: 'A', suit: 's' },
                { rank: '5', suit: 's' }
            ];
            const board: Card[] = [
                { rank: 'K', suit: 's' },
                { rank: '8', suit: 's' },
                { rank: '2', suit: 'd' }
            ];

            const draws = OddsCalculator.analyzeDraws(heroCards, board);
            expect(draws.some(d => d.name === 'Flush Draw')).toBe(true);
            expect(draws.find(d => d.name === 'Flush Draw')?.outs).toBe(9);
        });

        it('detects open-ended straight draws correctly', () => {
            const heroCards: Card[] = [
                { rank: '8', suit: 'h' },
                { rank: '9', suit: 'd' }
            ];
            const board: Card[] = [
                { rank: 'T', suit: 's' },
                { rank: 'J', suit: 'c' },
                { rank: '2', suit: 'd' }
            ];

            const draws = OddsCalculator.analyzeDraws(heroCards, board);
            expect(draws.some(d => d.name === 'Open-Ended Straight Draw')).toBe(true);
            expect(draws.find(d => d.name === 'Open-Ended Straight Draw')?.outs).toBe(8);
        });

        it('detects gutshot straight draws correctly', () => {
            const heroCards: Card[] = [
                { rank: '8', suit: 'h' },
                { rank: '9', suit: 'd' }
            ];
            const board: Card[] = [
                { rank: '6', suit: 's' },
                { rank: 'Q', suit: 'c' },
                { rank: '5', suit: 'd' }
            ]; // 5, 6, 8, 9 -> needs 7 = 4 outs

            const draws = OddsCalculator.analyzeDraws(heroCards, board);
            expect(draws.some(d => d.name === 'Gutshot Straight Draw')).toBe(true);
            expect(draws.find(d => d.name === 'Gutshot Straight Draw')?.outs).toBe(4);
        });

        it('detects overcards when no straight or flush draw exists', () => {
            const heroCards: Card[] = [
                { rank: 'A', suit: 'h' },
                { rank: 'K', suit: 'd' }
            ];
            const board: Card[] = [
                { rank: '2', suit: 's' },
                { rank: '5', suit: 'c' },
                { rank: '9', suit: 'd' }
            ];

            const draws = OddsCalculator.analyzeDraws(heroCards, board);
            expect(draws.some(d => d.name.includes('Overcard'))).toBe(true);
            expect(draws[0].outs).toBe(6);
        });
    });

    describe('Full Odds Analysis & EV Recommendation', () => {
        it('evaluates a profitable +EV flush draw call', () => {
            const heroCards: Card[] = [
                { rank: 'A', suit: 'h' },
                { rank: '4', suit: 'h' }
            ];
            const board: Card[] = [
                { rank: 'K', suit: 'h' },
                { rank: '9', suit: 'h' },
                { rank: '2', suit: 's' }
            ];

            // Pot is 160, call is 40 -> total pot 200, pot odds 20%
            // Flush draw on flop is ~35% equity. 35% > 20% -> +EV Call
            const analysis = OddsCalculator.analyzeFullOdds(heroCards, board, 40, 160, 'flop');
            expect(analysis.potOddsPercent).toBe(20);
            expect(analysis.drawEquityPercent).toBe(35);
            expect(analysis.isProfitableCall).toBe(true);
            expect(analysis.recommendation).toContain('+EV Call');
        });
    });
});
