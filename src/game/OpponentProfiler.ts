import { Player, PlayerStats } from './types';

export type OpponentType = 'Nit' | 'TAG' | 'LAG' | 'Fish' | 'Unknown';

export class OpponentProfiler {
    static initializeStats(): PlayerStats {
        return {
            vpip: 0,
            pfr: 0,
            af: 0,
            handsPlayed: 0,
            handsWon: 0,
            vpipCount: 0,
            pfrCount: 0,
            threeBetCount: 0,
            threeBetOpportunity: 0,
            aggressionsCount: 0,
            callsCount: 0,
            sessionPnL: 0,
            showdownsReached: 0,
            showdownsWon: 0
        };
    }

    /**
     * Called at the end of a hand to update per-hand stats (VPIP, PFR)
     * @param player The player to update
     * @param putMoneyInPot Did they voluntarily put money in? (Call/Raise)
     * @param raisedPreFlop Did they raise pre-flop?
     */
    static updateHandStats(player: Player, putMoneyInPot: boolean, raisedPreFlop: boolean) {
        if (!player.stats) player.stats = this.initializeStats();

        player.stats.handsPlayed++;
        if (putMoneyInPot) player.stats.vpipCount++;
        if (raisedPreFlop) player.stats.pfrCount++;

        // Recalculate percentages
        player.stats.vpip = (player.stats.vpipCount / player.stats.handsPlayed) * 100;
        player.stats.pfr = (player.stats.pfrCount / player.stats.handsPlayed) * 100;
    }

    /**
     * Called on every post-flop action to update Aggression Factor
     * @param player 
     * @param action 'bet' | 'raise' | 'call'
     */
    static updatePostFlopAction(player: Player, action: 'bet' | 'raise' | 'call') {
        if (!player.stats) player.stats = this.initializeStats();

        if (action === 'bet' || action === 'raise') {
            player.stats.aggressionsCount++;
        } else if (action === 'call') {
            player.stats.callsCount++;
        }

        // AF = (Bets + Raises) / Calls
        // If calls is 0, AF is effectively infinite. We cap it or display cleanly.
        if (player.stats.callsCount > 0) {
            player.stats.af = player.stats.aggressionsCount / player.stats.callsCount;
        } else {
            // Infinite aggression (never called). 
            // Represent as 0 if no aggressions either, or a high number if aggressive.
            if (player.stats.aggressionsCount > 0) {
                player.stats.af = player.stats.aggressionsCount; // Show raw count as proxy for inf?
            } else {
                player.stats.af = 0;
            }
        }
    }

    /**
     * Updates 3-Bet statistics
     * @param player 
     * @param isThreeBet Did the player Make a 3-bet?
     * @param isOpportunity Did the player have an opportunity to 3-bet?
     */
    static updateThreeBetStats(player: Player, isThreeBet: boolean, isOpportunity: boolean) {
        if (!player.stats) player.stats = this.initializeStats();

        if (isOpportunity) {
            player.stats.threeBetOpportunity++;
        }
        if (isThreeBet) {
            player.stats.threeBetCount++;
        }
    }

    static classify(player: Player): OpponentType {
        const stats = player.stats;
        if (!stats || stats.handsPlayed < 50) return 'Unknown'; // Need larger sample size (50 hands)

        const { vpip, pfr } = stats;

        // Classification Logic (6-Max approximate ranges)

        // Nit: VPIP < 18, PFR < 14
        if (vpip < 18 && pfr < 14) return 'Nit';

        // Fish: High VPIP, Low PFR (Gap > 15)
        // e.g. 40/10, 50/5
        if (vpip > 30 && pfr < 15) return 'Fish';

        // TAG: VPIP 18-28, PFR 15-25 (Tight Aggressive)
        if (vpip >= 18 && vpip <= 28 && pfr >= 15) return 'TAG';

        // LAG: VPIP > 28, PFR > 20 (Loose Aggressive)
        if (vpip > 28 && pfr > 20) return 'LAG';

        return 'Unknown'; // Middle ground
    }
}
