import { GameState } from './types';
import { HandEvaluator } from './HandEvaluator';
import { OpponentProfiler } from './OpponentProfiler';

export class ShowdownResolver {
    static resolve(state: GameState) {
        const activePlayers = state.players.filter(p => p.status === 'active' || p.status === 'all-in');

        if (activePlayers.length === 0) return;

        if (activePlayers.length === 1) {
            const winner = activePlayers[0];
            winner.chips += state.pot;
            winner.stats.handsWon++; // STATS

            // Calculate session P/L for all players who participated in this hand
            state.players.forEach(p => {
                if (p.handContribution > 0) {
                    const won = p.id === winner.id ? state.pot : 0;
                    p.stats.sessionPnL += won - p.handContribution;
                }
            });

            state.winners = [winner.id];
            state.winnerInfo = {
                playerIds: [winner.id],
                handDescription: 'Everyone else folded',
                potWon: state.pot
            };
            console.log(`Winner by fold: ${winner.name} wins $${state.pot}`);

            // Track hand history for session dashboard
            const hero = state.players.find(p => p.isHuman);
            if (hero) {
                const heroWon = hero.id === winner.id ? state.pot : 0;
                const heroNetWon = heroWon - hero.handContribution;

                state.sessionHands.push({
                    handNumber: state.handNumber,
                    heroNetWon,
                    heroShowdownWon: 0,
                    heroNonShowdownWon: heroNetWon,
                    heroAllInEV: 0, // No EV calculation for fold wins
                    finalPot: state.pot,
                    isShowdown: false,
                    winnerIds: [winner.id],
                    heroCards: [...hero.cards],
                    heroPosition: hero.position,
                    communityCards: [...state.communityCards],
                    actionLog: [...state.currentHandLog]
                });
            }

            // End of Hand Stats Update (Fold Path)
            const hasHero = state.players.some(p => p.isHuman);
            if (hasHero) {
                state.players.forEach(p => {
                    if (p.status !== 'eliminated') {
                        OpponentProfiler.updateHandStats(p, !!p.hasVPIPInHand, !!p.hasPFRInHand);
                    }
                });
            }
            return;
        }

        const results = activePlayers.map(p => ({
            player: p,
            hand: HandEvaluator.evaluate(p.cards, state.communityCards)
        }));

        // STATS: Track Showdowns Reached
        activePlayers.forEach(p => p.stats.showdownsReached++);

        results.sort((a, b) => b.hand.value - a.hand.value);

        const bestValue = results[0].hand.value;
        const winners = results.filter(r => r.hand.value === bestValue);

        const splitPot = Math.floor(state.pot / winners.length);

        winners.forEach(w => {
            w.player.chips += splitPot;
            w.player.stats.handsWon++; // Total Wins
            w.player.stats.showdownsWon++; // Showdown Wins
            if (w.player.sawFlop) {
                w.player.stats.wonWhenSawFlopCount++;
            }
        });

        // Calculate session P/L for all players who participated in this hand
        // P/L = chips won - chips contributed
        state.players.forEach(p => {
            if (p.handContribution > 0) {
                const won = winners.some(w => w.player.id === p.id) ? splitPot : 0;
                p.stats.sessionPnL += won - p.handContribution;
            }
        });

        state.winners = winners.map(w => w.player.id);
        state.winnerInfo = {
            playerIds: winners.map(w => w.player.id),
            handDescription: results[0].hand.description,
            potWon: state.pot,
            winningCards: results[0].hand.cards
        };

        const winnerNames = winners.map(w => w.player.name).join(', ');
        console.log(`Showdown! ${winnerNames} wins $${splitPot} with ${results[0].hand.description}`);

        // Track hand history for session dashboard
        const hero = state.players.find(p => p.isHuman);
        if (hero) {
            const heroWon = winners.some(w => w.player.id === hero.id) ? splitPot : 0;
            const heroNetWon = heroWon - hero.handContribution;
            const isShowdown = activePlayers.length > 1; // True showdown if multiple players
            
            let heroHandDesc = undefined;
            if (isShowdown && activePlayers.some(p => p.id === hero.id)) {
                // Find hero's evaluation
                const heroResult = results.find(r => r.player.id === hero.id);
                if (heroResult) {
                    heroHandDesc = heroResult.hand.description;
                }
            }

            state.sessionHands.push({
                handNumber: state.handNumber,
                heroNetWon,
                heroShowdownWon: isShowdown ? heroNetWon : 0,
                heroNonShowdownWon: isShowdown ? 0 : heroNetWon,
                heroAllInEV: 0, // TODO: Calculate EV when hero is all-in
                finalPot: state.pot,
                isShowdown,
                winnerIds: winners.map(w => w.player.id),
                heroCards: [...hero.cards],
                heroPosition: hero.position,
                communityCards: [...state.communityCards],
                actionLog: [...state.currentHandLog],
                heroHandDescription: heroHandDesc
            });
        }

        // End of Hand Stats Update
        const hasHero = state.players.some(p => p.isHuman);
        if (hasHero) {
            state.players.forEach(p => {
                if (p.status !== 'eliminated') {
                    OpponentProfiler.updateHandStats(p, !!p.hasVPIPInHand, !!p.hasPFRInHand);
                }
            });
        }
    }
}
