import { Deck } from './Deck';
import { HandEvaluator } from './HandEvaluator';
import { GameState, Player, PlayerRole, Position } from './types';
import { OpponentProfiler } from './OpponentProfiler';

const POSITIONS_6MAX: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

export class PokerGame {
    state: GameState;
    private deck: Deck;

    constructor(initialPlayers: Player[]) {
        this.deck = new Deck();
        this.state = {
            id: crypto.randomUUID(),
            phase: 'pre-flop',
            pot: 0,
            communityCards: [],
            deck: [],
            players: initialPlayers,
            activePlayerId: initialPlayers[0]?.id || '',
            dealerIndex: -1, // Will be 0 after first startNewHand
            smallBlindAmount: 1,
            bigBlindAmount: 2,
            minRaise: 4, // 2x BB minimum raise
            currentBet: 0,
            winners: [],
            winnerInfo: undefined,
            eliminatedPlayerIds: [],
            isGameOver: false,
            handNumber: 0,
            sessionHands: [],
            currentHandLog: []
        };
    }

    startNewHand() {
        // Check for game over condition
        const playersWithChips = this.state.players.filter(p => p.chips > 0);
        if (playersWithChips.length <= 1) {
            this.state.isGameOver = true;
            return;
        }

        this.deck.reset();
        this.deck.shuffle();
        this.state.pot = 0;
        this.state.communityCards = [];
        this.state.phase = 'pre-flop';
        this.state.currentBet = this.state.bigBlindAmount;
        this.state.minRaise = this.state.bigBlindAmount * 2; // 2x BB minimum raise
        this.state.winners = [];
        this.state.winnerInfo = undefined;
        this.state.handNumber++;
        this.state.currentHandLog = [];

        // Rotate dealer (skip eliminated players)
        let newDealerIdx = (this.state.dealerIndex + 1) % this.state.players.length;
        let attempts = 0;
        while (this.state.players[newDealerIdx].chips <= 0 && attempts < this.state.players.length) {
            newDealerIdx = (newDealerIdx + 1) % this.state.players.length;
            attempts++;
        }
        this.state.dealerIndex = newDealerIdx;

        // Reset players and assign positions
        this.state.players.forEach((player, idx) => {
            player.cards = [];
            if (player.chips > 0) {
                player.status = 'active';
                // player.stats.handsPlayed++; // Moved to OpponentProfiler.updateHandStats at end of hand
            } else {
                player.status = 'eliminated';
                if (!this.state.eliminatedPlayerIds.includes(player.id)) {
                    this.state.eliminatedPlayerIds.push(player.id);
                }
            }
            player.currentBet = 0;
            player.role = 'none';
            player.hasActed = false;
            player.lastAction = null;
            // Reset hand tracking flags
            player.hasVPIPInHand = false;
            player.hasPFRInHand = false;
            player.handContribution = 0; // Reset pot contribution for new hand

            // Assign position relative to dealer
            const positionOffset = (idx - this.state.dealerIndex + this.state.players.length) % this.state.players.length;
            player.position = POSITIONS_6MAX[positionOffset];
        });

        // Find small blind and big blind (skip eliminated players)
        const activePlayerIndices = this.state.players
            .map((p, i) => ({ player: p, index: i }))
            .filter(x => x.player.status === 'active')
            .map(x => x.index);

        if (activePlayerIndices.length < 2) {
            this.state.isGameOver = true;
            return;
        }

        // Find positions relative to dealer
        const dealerPos = this.state.dealerIndex;
        let sbIdx = -1, bbIdx = -1;

        // Find SB (first active player after dealer)
        for (let i = 1; i <= this.state.players.length; i++) {
            const idx = (dealerPos + i) % this.state.players.length;
            if (this.state.players[idx].status === 'active') {
                sbIdx = idx;
                break;
            }
        }

        // Find BB (first active player after SB)
        for (let i = 1; i <= this.state.players.length; i++) {
            const idx = (sbIdx + i) % this.state.players.length;
            if (this.state.players[idx].status === 'active') {
                bbIdx = idx;
                break;
            }
        }

        this.postBlind(sbIdx, this.state.smallBlindAmount, 'small-blind');
        this.postBlind(bbIdx, this.state.bigBlindAmount, 'big-blind');

        // Deal hole cards only to active players
        this.state.players.forEach(player => {
            if (player.status === 'active' || player.status === 'all-in') {
                const c1 = this.deck.deal();
                const c2 = this.deck.deal();
                if (c1 && c2) player.cards.push(c1, c2);
            }
        });

        // UTG starts pre-flop (first active player after BB)
        let utgIdx = bbIdx;
        for (let i = 1; i <= this.state.players.length; i++) {
            const idx = (bbIdx + i) % this.state.players.length;
            if (this.state.players[idx].status === 'active') {
                utgIdx = idx;
                break;
            }
        }
        this.state.activePlayerId = this.state.players[utgIdx].id;

        console.log(`Hand #${this.state.handNumber} started. Dealer: ${this.state.players[dealerPos].name}`);
    }

    private postBlind(playerIdx: number, amount: number, role: PlayerRole) {
        const player = this.state.players[playerIdx];
        if (player && player.status === 'active') {
            const bet = Math.min(player.chips, amount);
            player.chips -= bet;
            player.currentBet = bet;
            // Removed: this.state.pot += bet; (Waiting for end of round)
            player.role = role;
            if (player.chips === 0) player.status = 'all-in';
        }
    }

    handleAction(playerId: string, action: 'fold' | 'check' | 'call' | 'raise', raiseAmount?: number) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player || player.id !== this.state.activePlayerId) return;

        const isBet = action === 'raise' && this.state.currentBet === 0 && this.state.phase !== 'pre-flop';
        const displayAction = isBet ? 'bet' : action;

        // Format hole cards (e.g., "AhKs")
        const handStr = player.cards.map(c => `${c.rank}${c.suit}`).join('');
        const actionDesc = `${player.name} ${displayAction}s${raiseAmount ? ` $${raiseAmount}` : ''} (${handStr})`;
        console.log(`Player ${player.name} action: ${displayAction}${raiseAmount ? ` to $${raiseAmount}` : ''}`);
        this.state.currentHandLog.push(actionDesc);
        // --- STATS TRACKING ---
        if (this.state.phase === 'pre-flop') {
            const isVPIP = action === 'call' || action === 'raise';
            const isPFR = action === 'raise';

            if (isVPIP && !player.hasVPIPInHand) player.hasVPIPInHand = true;
            if (isPFR && !player.hasPFRInHand) player.hasPFRInHand = true;

            // 3-Bet Tracking
            // A 3-bet opportunity is when facing a raise (currentBet > bigBlind)
            const facingRaise = this.state.currentBet > this.state.bigBlindAmount;
            if (facingRaise) { // Only track if facing a raise
                const isThreeBet = action === 'raise';
                OpponentProfiler.updateThreeBetStats(player, isThreeBet, true);
            }
        } else {
            // Post-flop: Track Aggression Factor
            if (action === 'raise') {
                OpponentProfiler.updatePostFlopAction(player, 'raise');
            } else if (action === 'call') {
                OpponentProfiler.updatePostFlopAction(player, 'call');
            } else if (action === 'check') {
                // Checks don't impact AF usually, or count as passive? Standard AF doesn't count checks.
            }
        }
        // ----------------------

        player.lastAction = displayAction;
        player.hasActed = true;

        switch (action) {
            case 'fold':
                player.status = 'folded';
                // Check if only one player remains
                const remainingActive = this.state.players.filter(p =>
                    p.status === 'active' || p.status === 'all-in'
                );
                if (remainingActive.length === 1) {
                    this.collectBets(); // Collect pot before ending
                    this.state.phase = 'showdown';
                    this.resolveShowdown();
                    return;
                }
                break;
            case 'check':
                if (this.state.currentBet > player.currentBet) {
                    console.error("Invalid check - must call or fold");
                    return;
                }
                break;
            case 'call':
                const callCost = this.state.currentBet - player.currentBet;
                const actualCall = Math.min(player.chips, callCost);
                player.chips -= actualCall;
                player.currentBet += actualCall;
                // player.stats.callsCount++; // Handled by OpponentProfiler
                if (player.chips === 0) player.status = 'all-in';
                break;
            case 'raise':
                // Strict validation: Must treat undefined raiseAmount as invalid
                if (!raiseAmount) {
                    console.error("Raise action missing amount");
                    return;
                }

                const minRaise = this.state.minRaise;
                const playerStack = player.chips + player.currentBet;

                // Cap raise at player's max stack (All-in)
                let validAmount = Math.min(raiseAmount, playerStack);

                // Enforce minimum raise (unless all-in)
                if (validAmount < minRaise && validAmount < playerStack) {
                    // If they tried to raise less than min but not all-in, force min-raise
                    // Or if they can't afford min-raise, force all-in
                    validAmount = Math.min(minRaise, playerStack);
                }

                // If the "raise" is just a call or less (e.g. invalid logic), assume call
                if (validAmount <= this.state.currentBet) {
                    // Fallback to call logic
                    const callCost = this.state.currentBet - player.currentBet;
                    const actualCall = Math.min(player.chips, callCost);
                    player.chips -= actualCall;
                    player.currentBet += actualCall;
                    // player.stats.callsCount++; // Handled by OpponentProfiler
                    if (player.chips === 0) player.status = 'all-in';
                    break;
                }

                // Apply the valid raise
                const totalBet = validAmount;
                const cost = totalBet - player.currentBet;
                const actualCost = Math.min(player.chips, cost);

                player.chips -= actualCost;
                player.currentBet += actualCost;

                // STATS: AF Numerator - Handled by OpponentProfiler

                // Calculate actual raise size (amount ABOVE previous bet)
                const raiseSize = player.currentBet - this.state.currentBet;

                // Reset act status for all active players (re-opening betting)
                // STRICT RULE: Only re-open betting if the raise is a full legal raise
                // (i.e. raiseSize >= diff between minRaise and old currentBet? No, standard is raiseSize >= lastRaiseSize)
                // For simplicity here: Any valid raise re-opens. 
                // However, technically if an all-in is LESS than a min-raise, it does NOT re-open for those who already acted.
                // We will implement simple re-open for now to fix the main bug.

                const isFullRaise = validAmount >= minRaise;
                if (isFullRaise) {
                    this.state.players.forEach(p => {
                        if (p.id !== player.id && p.status === 'active') {
                            p.hasActed = false;
                        }
                    });
                    // Only update minRaise if it was a full raise
                    this.state.minRaise = this.state.currentBet + Math.max(raiseSize, this.state.bigBlindAmount);
                } else {
                    // Incomplete raise (all-in that didn't meet min-raise)
                    // Does NOT re-open betting for players who already matched the previous bet.
                    // But we need to make sure they still get a turn if they haven't acted?
                    // Complex side-pot logic omitted for MVP, but preventing infinite loop is key.
                    this.state.players.forEach(p => {
                        if (p.id !== player.id && p.status === 'active' && p.currentBet < player.currentBet) {
                            p.hasActed = false; // Only re-open for those who have to call the extra
                        }
                    });
                }

                this.state.currentBet = player.currentBet;

                if (player.chips === 0) player.status = 'all-in';
                break;
        }

        this.nextTurn();
    }

    private nextTurn() {
        // Check for showdown conditions
        const activePlayers = this.state.players.filter(p => p.status === 'active');
        const allInPlayers = this.state.players.filter(p => p.status === 'all-in');

        console.log(`[nextTurn] Phase: ${this.state.phase}, Active: ${activePlayers.length}, AllIn: ${allInPlayers.length}`);
        activePlayers.forEach(p => console.log(`  Active: ${p.name} bet=${p.currentBet} hasActed=${p.hasActed}`));
        allInPlayers.forEach(p => console.log(`  AllIn: ${p.name} bet=${p.currentBet}`));

        // If everyone is all-in, we need to run out the board
        if (activePlayers.length === 0 && allInPlayers.length > 1) {
            console.log(`[nextTurn] -> Everyone all-in, running out the board`);
            // Check if betting round is complete first
            const roundComplete = this.isRoundComplete();
            if (roundComplete) {
                this.collectBets();
                this.nextPhase(); // This will recursively deal remaining streets
            }
            return;
        }

        // If only one active player and no all-ins waiting, end the hand
        if (activePlayers.length === 0 || (activePlayers.length === 1 && allInPlayers.length === 0)) {
            console.log(`[nextTurn] -> SHOWDOWN (only 1 or 0 active, no all-ins)`);
            if (this.state.phase !== 'showdown') {
                this.collectBets(); // Collect bets before showdown
                this.state.phase = 'showdown';
                this.resolveShowdown();
            }
            return;
        }

        // Check if betting round is complete
        const roundComplete = this.isRoundComplete();
        console.log(`[nextTurn] isRoundComplete = ${roundComplete}`);

        if (roundComplete) {
            console.log(`[nextTurn] -> NEXT PHASE`);
            this.collectBets(); // Collect bets before phase change
            this.nextPhase();
            return;
        }

        // Find next active player
        let idx = this.state.players.findIndex(p => p.id === this.state.activePlayerId);
        let nextIdx = (idx + 1) % this.state.players.length;
        let loopCount = 0;

        while (this.state.players[nextIdx].status !== 'active' && loopCount < this.state.players.length) {
            nextIdx = (nextIdx + 1) % this.state.players.length;
            loopCount++;
        }

        if (loopCount < this.state.players.length) {
            this.state.activePlayerId = this.state.players[nextIdx].id;
            console.log(`[nextTurn] -> Next active player: ${this.state.players[nextIdx].name}`);
        }
    }

    private collectBets() {
        // Sweep all current bets into the pot
        this.state.players.forEach(p => {
            if (p.currentBet > 0) {
                this.state.pot += p.currentBet;
                p.handContribution += p.currentBet; // Track contribution for P/L
                p.currentBet = 0; // Reset after collecting
            }
        });
    }

    private isRoundComplete(): boolean {
        const activePlayers = this.state.players.filter(p => p.status === 'active');
        const allInPlayers = this.state.players.filter(p => p.status === 'all-in');

        // Special case: Everyone is all-in (e.g., KK vs AA preflop)
        if (activePlayers.length === 0 && allInPlayers.length > 1) {
            console.log(`[isRoundComplete] TRUE - everyone all-in, need to run out board`);
            return true;
        }

        if (activePlayers.length === 0) {
            console.log(`[isRoundComplete] TRUE - no active players`);
            return true;
        }

        if (activePlayers.length === 1) {
            const allInPlayers = this.state.players.filter(p => p.status === 'all-in');
            if (allInPlayers.length > 0) {
                // Single active player vs all-in: check if they've matched the bet
                const active = activePlayers[0];
                const needsToAct = active.currentBet < this.state.currentBet || !active.hasActed;
                if (!needsToAct) {
                    console.log(`[isRoundComplete] TRUE - 1 active matched bet vs all-in(s)`);
                    return true;
                }
                console.log(`[isRoundComplete] FALSE - 1 active needs to respond to all-in`);
                return false;
            }
        }

        const currentBet = this.state.currentBet;
        const betsMatch = activePlayers.every(p => p.currentBet === currentBet);
        const allActed = activePlayers.every(p => p.hasActed);

        console.log(`[isRoundComplete] currentBet=${currentBet}, betsMatch=${betsMatch}, allActed=${allActed}`);
        activePlayers.forEach(p => console.log(`  ${p.name}: bet=${p.currentBet}, hasActed=${p.hasActed}`));

        return betsMatch && allActed;
    }

    private nextPhase() {
        this.state.players.forEach(p => {
            p.currentBet = 0; // Visual reset happens here
            p.hasActed = false;
            p.lastAction = null;
        });
        this.state.currentBet = 0;
        this.state.minRaise = this.state.bigBlindAmount;

        const activePlayers = this.state.players.filter(p => p.status === 'active');
        const allInPlayers = this.state.players.filter(p => p.status === 'all-in');

        const needsRunout = activePlayers.length <= 1 && allInPlayers.length > 0;

        if (this.state.phase === 'pre-flop') {
            this.state.phase = 'flop';
            this.state.currentHandLog.push("--- FLOP ---");
            this.dealCommunityCards(3);
        } else if (this.state.phase === 'flop') {
            this.state.phase = 'turn';
            this.state.currentHandLog.push("--- TURN ---");
            this.dealCommunityCards(1);
        } else if (this.state.phase === 'turn') {
            this.state.phase = 'river';
            this.state.currentHandLog.push("--- RIVER ---");
            this.dealCommunityCards(1);
        } else if (this.state.phase === 'river') {
            this.state.phase = 'showdown';
            this.resolveShowdown();
            return;
        }

        if (needsRunout && this.state.phase !== 'showdown') {
            this.nextPhase();
            return;
        }

        if (this.state.phase !== 'showdown' && activePlayers.length > 0) {
            let startIdx = (this.state.dealerIndex + 1) % this.state.players.length;
            let loopCount = 0;

            while (this.state.players[startIdx].status !== 'active' && loopCount < this.state.players.length) {
                startIdx = (startIdx + 1) % this.state.players.length;
                loopCount++;
            }

            if (loopCount < this.state.players.length) {
                this.state.activePlayerId = this.state.players[startIdx].id;
            }
        }
    }
    private resolveShowdown() {
        const activePlayers = this.state.players.filter(p => p.status === 'active' || p.status === 'all-in');

        if (activePlayers.length === 0) return;

        if (activePlayers.length === 1) {
            const winner = activePlayers[0];
            winner.chips += this.state.pot;
            winner.stats.handsWon++; // STATS

            // Calculate session P/L for all players who participated in this hand
            this.state.players.forEach(p => {
                if (p.handContribution > 0) {
                    const won = p.id === winner.id ? this.state.pot : 0;
                    p.stats.sessionPnL += won - p.handContribution;
                }
            });

            this.state.winners = [winner.id];
            this.state.winnerInfo = {
                playerIds: [winner.id],
                handDescription: 'Everyone else folded',
                potWon: this.state.pot
            };
            console.log(`Winner by fold: ${winner.name} wins $${this.state.pot}`);

            // Track hand history for session dashboard
            const hero = this.state.players.find(p => p.isHuman);
            if (hero) {
                const heroWon = hero.id === winner.id ? this.state.pot : 0;
                const heroNetWon = heroWon - hero.handContribution;

                this.state.sessionHands.push({
                    handNumber: this.state.handNumber,
                    heroNetWon,
                    heroShowdownWon: 0,
                    heroNonShowdownWon: heroNetWon,
                    heroAllInEV: 0, // No EV calculation for fold wins
                    finalPot: this.state.pot,
                    isShowdown: false,
                    winnerIds: [winner.id],
                    heroCards: [...hero.cards],
                    heroPosition: hero.position,
                    communityCards: [...this.state.communityCards],
                    actionLog: [...this.state.currentHandLog]
                });
            }

            // End of Hand Stats Update (Fold Path)
            this.state.players.forEach(p => {
                if (p.status !== 'eliminated') {
                    OpponentProfiler.updateHandStats(p, !!p.hasVPIPInHand, !!p.hasPFRInHand);
                }
            });
            return;
        }

        const results = activePlayers.map(p => ({
            player: p,
            hand: HandEvaluator.evaluate(p.cards, this.state.communityCards)
        }));

        // STATS: Track Showdowns Reached
        activePlayers.forEach(p => p.stats.showdownsReached++);

        results.sort((a, b) => b.hand.value - a.hand.value);

        const bestValue = results[0].hand.value;
        const winners = results.filter(r => r.hand.value === bestValue);

        const splitPot = Math.floor(this.state.pot / winners.length);

        winners.forEach(w => {
            w.player.chips += splitPot;
            w.player.stats.handsWon++; // Total Wins
            w.player.stats.showdownsWon++; // Showdown Wins
        });

        // Calculate session P/L for all players who participated in this hand
        // P/L = chips won - chips contributed
        this.state.players.forEach(p => {
            if (p.handContribution > 0) {
                const won = winners.some(w => w.player.id === p.id) ? splitPot : 0;
                p.stats.sessionPnL += won - p.handContribution;
            }
        });

        this.state.winners = winners.map(w => w.player.id);
        this.state.winnerInfo = {
            playerIds: winners.map(w => w.player.id),
            handDescription: results[0].hand.description,
            potWon: this.state.pot,
            winningCards: results[0].hand.cards
        };

        const winnerNames = winners.map(w => w.player.name).join(', ');
        console.log(`Showdown! ${winnerNames} wins $${splitPot} with ${results[0].hand.description}`);

        // Track hand history for session dashboard
        const hero = this.state.players.find(p => p.isHuman);
        if (hero) {
            const heroWon = winners.some(w => w.player.id === hero.id) ? splitPot : 0;
            const heroNetWon = heroWon - hero.handContribution;
            const isShowdown = activePlayers.length > 1; // True showdown if multiple players

            this.state.sessionHands.push({
                handNumber: this.state.handNumber,
                heroNetWon,
                heroShowdownWon: isShowdown ? heroNetWon : 0,
                heroNonShowdownWon: isShowdown ? 0 : heroNetWon,
                heroAllInEV: 0, // TODO: Calculate EV when hero is all-in
                finalPot: this.state.pot,
                isShowdown,
                winnerIds: winners.map(w => w.player.id),
                heroCards: [...hero.cards],
                heroPosition: hero.position,
                communityCards: [...this.state.communityCards],
                actionLog: [...this.state.currentHandLog]
            });
        }

        // End of Hand Stats Update
        this.state.players.forEach(p => {
            if (p.status !== 'eliminated') {
                OpponentProfiler.updateHandStats(p, !!p.hasVPIPInHand, !!p.hasPFRInHand);
            }
        });
    }

    private dealCommunityCards(count: number) {
        for (let i = 0; i < count; i++) {
            const card = this.deck.deal();
            if (card) this.state.communityCards.push(card);
        }
    }

    getActivePlayers(): Player[] {
        return this.state.players.filter(p => p.status === 'active' || p.status === 'all-in');
    }

    getPlayersWithChips(): Player[] {
        return this.state.players.filter(p => p.chips > 0);
    }

    isGameOver(): boolean {
        return this.getPlayersWithChips().length <= 1;
    }

    getPlayerPosition(playerId: string): Position | undefined {
        return this.state.players.find(p => p.id === playerId)?.position;
    }

    buyIn(playerId: string, amount: number) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return;

        // Track cumulative buy-ins for session winnings
        player.totalBuyIn += amount;

        // Reset to full stack
        player.chips = amount;

        // Remove from eliminated list
        this.state.eliminatedPlayerIds = this.state.eliminatedPlayerIds.filter(id => id !== playerId);

        // If game was over but now we have enough players, resume
        if (this.state.isGameOver) {
            const playersWithChips = this.state.players.filter(p => p.chips > 0);
            if (playersWithChips.length >= 2) {
                this.state.isGameOver = false;
            }
        }
    }
}
