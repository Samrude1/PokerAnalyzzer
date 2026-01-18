import { describe, it, expect } from 'vitest';
import { OpponentProfiler } from './OpponentProfiler';
import { Player } from './types';

describe('OpponentProfiler', () => {
    // Helper to create a mock player
    const mockPlayer = (id: string, name: string): Player => ({
        id, name, chips: 1000, initialChips: 1000, totalBuyIn: 1000,
        cards: [], status: 'active', currentBet: 0, role: 'none', isHuman: false,
        hasActed: false, hasVPIPInHand: false, hasPFRInHand: false, handContribution: 0,
        stats: OpponentProfiler.initializeStats()
    });

    it('should initialize stats correctly', () => {
        const stats = OpponentProfiler.initializeStats();
        expect(stats.vpip).toBe(0);
        expect(stats.handsPlayed).toBe(0);
    });

    it('should update VPIP and PFR correctly', () => {
        const p = mockPlayer('p1', 'Bot');

        // Hand 1: Fold (No VPIP)
        OpponentProfiler.updateHandStats(p, false, false);
        expect(p.stats.handsPlayed).toBe(1);
        expect(p.stats.vpip).toBe(0);

        // Hand 2: Raise Pre-flop (VPIP + PFR)
        OpponentProfiler.updateHandStats(p, true, true);
        expect(p.stats.handsPlayed).toBe(2);
        expect(p.stats.vpip).toBe(50); // 1/2
        expect(p.stats.pfr).toBe(50);  // 1/2

        // Hand 3: Call (VPIP only)
        OpponentProfiler.updateHandStats(p, true, false);
        expect(p.stats.handsPlayed).toBe(3);
        expect(p.stats.vpip).toBeCloseTo(66.66, 1); // 2/3
        expect(p.stats.pfr).toBeCloseTo(33.33, 1);  // 1/3
    });

    it('should classify players correctly', () => {
        const p = mockPlayer('p2', 'Test');

        // Simulate "Nit" (100 hands, 10 VPIP, 5 PFR)
        p.stats.handsPlayed = 100;
        p.stats.vpip = 10;
        p.stats.pfr = 5;
        expect(OpponentProfiler.classify(p)).toBe('Nit');

        // Simulate "LAG" (100 hands, 40 VPIP, 30 PFR)
        p.stats.vpip = 40;
        p.stats.pfr = 30;
        expect(OpponentProfiler.classify(p)).toBe('LAG');

        // Simulate "Fish" (100 hands, 50 VPIP, 5 PFR)
        p.stats.vpip = 50;
        p.stats.pfr = 5;
        expect(OpponentProfiler.classify(p)).toBe('Fish');
    });

    it('should update Aggression Factor', () => {
        const p = mockPlayer('p3', 'Aggro');

        OpponentProfiler.updatePostFlopAction(p, 'bet'); // Aggression = 1
        expect(p.stats.aggressionsCount).toBe(1);
        expect(p.stats.af).toBe(1); // 1 / 0 treated as 1 (uncapped in MVP logic?) -> Code says if calls>0 calc, else = count

        OpponentProfiler.updatePostFlopAction(p, 'call'); // Calls = 1
        // AF = 1 / 1 = 1
        expect(p.stats.af).toBe(1);

        OpponentProfiler.updatePostFlopAction(p, 'raise'); // Aggression = 2
        // AF = 2 / 1 = 2
        expect(p.stats.af).toBe(2);
    });
});
