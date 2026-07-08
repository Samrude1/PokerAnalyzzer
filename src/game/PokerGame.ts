import { Deck } from './Deck';
import { GameState, Player, PlayerRole, Position } from './types';
import { OpponentProfiler } from './OpponentProfiler';
import { BotLogic } from './BotLogic';
import { ShowdownResolver } from './ShowdownResolver';

export class PokerGame {
    state: GameState;
    private deck: Deck;
    isTournament: boolean;

    constructor(initialPlayers: Player[], isTournament: boolean = false) {
        this.deck = new Deck();
        this.isTournament = isTournament;
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

        // Reset players
        this.state.players.forEach((player) => {
            player.cards = [];
            if (player.chips > 0) {
                player.status = 'active';
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
            player.hasVPIPInHand = false;
            player.hasPFRInHand = false;
            player.handContribution = 0;
        });

        const activeCount = this.state.players.filter(p => p.status === 'active').length;
        if (activeCount < 2) {
            this.state.isGameOver = true;
            return;
        }

        let positions: Position[];
        if (activeCount === 2) positions = ['BTN', 'BB'];
        else if (activeCount === 3) positions = ['BTN', 'SB', 'BB'];
        else if (activeCount === 4) positions = ['BTN', 'SB', 'BB', 'UTG'];
        else if (activeCount === 5) positions = ['BTN', 'SB', 'BB', 'UTG', 'CO'];
        else if (activeCount === 6) positions = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];
        else if (activeCount === 7) positions = ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO'];
        else if (activeCount === 8) positions = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'];
        else positions = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO'];

        let currentPos = 0;
        for (let i = 0; i < this.state.players.length; i++) {
            const idx = (this.state.dealerIndex + i) % this.state.players.length;
            const p = this.state.players[idx];
            if (p.status === 'active') {
                p.position = positions[currentPos];
                currentPos++;
            }
        }

        const dealerPos = this.state.dealerIndex;

        const getNextActive = (fromIdx: number) => {
            for (let i = 1; i <= this.state.players.length; i++) {
                const idx = (fromIdx + i) % this.state.players.length;
                if (this.state.players[idx].status === 'active') return idx;
            }
            return fromIdx;
        };

        const sbIdx = getNextActive(dealerPos);
        const bbIdx = getNextActive(sbIdx);
        const utgIdx = getNextActive(bbIdx);

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

        this.state.activePlayerId = this.state.players[utgIdx].id;
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
        this.state.currentHandLog.push(actionDesc);
        
        OpponentProfiler.trackAction(this.state, player, action);

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
                if (!raiseAmount) return;

                const playerStack = player.chips + player.currentBet;
                let validAmount = Math.min(raiseAmount, playerStack);

                if (validAmount < this.state.minRaise && validAmount < playerStack) {
                    validAmount = Math.min(this.state.minRaise, playerStack);
                }

                if (validAmount <= this.state.currentBet) {
                    const callCost = this.state.currentBet - player.currentBet;
                    const actualCall = Math.min(player.chips, callCost);
                    player.chips -= actualCall;
                    player.currentBet += actualCall;
                    if (player.chips === 0) player.status = 'all-in';
                    break;
                }

                const cost = validAmount - player.currentBet;
                player.chips -= cost;
                player.currentBet = validAmount;

                const raiseSize = validAmount - this.state.currentBet;
                if (validAmount >= this.state.minRaise) {
                    this.state.players.forEach(p => {
                        if (p.id !== player.id && p.status === 'active') p.hasActed = false;
                    });
                    this.state.minRaise = this.state.currentBet + Math.max(raiseSize, this.state.bigBlindAmount);
                } else {
                    this.state.players.forEach(p => {
                        if (p.id !== player.id && p.status === 'active' && p.currentBet < player.currentBet) p.hasActed = false;
                    });
                }
                
                this.state.currentBet = validAmount;
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
            
            // Mark active players as having seen the flop
            this.state.players.forEach(p => {
                if (p.status === 'active' || p.status === 'all-in') {
                    p.sawFlop = true;
                    if (p.stats) p.stats.sawFlopCount++;
                }
            });
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
        ShowdownResolver.resolve(this.state);
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

    autoPlayHand() {
        if (this.state.isGameOver) return;
        
        this.startNewHand();

        let failsafe = 0;
        while (!this.state.isGameOver && (!this.state.winners || this.state.winners.length === 0) && failsafe < 500) {
            failsafe++;
            const activePlayer = this.state.players.find(p => p.id === this.state.activePlayerId);
            
            if (activePlayer && activePlayer.status === 'active') {
                // Determine and apply bot action
                const decision = BotLogic.decide(this, activePlayer);
                this.handleAction(activePlayer.id, decision.action, decision.amount);
            } else {
                // If no active player, phase should have advanced or game ended
                if (this.state.phase === 'showdown') {
                    break;
                }
                // Check if everyone is all-in, nextTurn handles it but if it stuck here
                const activePlayers = this.state.players.filter(p => p.status === 'active');
                if (activePlayers.length === 0) {
                    break;
                }
            }
        }
    }

    setBlinds(smallBlind: number, bigBlind: number) {
        this.state.smallBlindAmount = smallBlind;
        this.state.bigBlindAmount = bigBlind;
    }

    buyIn(playerId: string, targetAmount: number) {
        if (this.isTournament) return; // Rebuys disabled in tournaments
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return;

        const amountToAdd = targetAmount - player.chips;
        if (amountToAdd <= 0) return;

        // Track cumulative buy-ins for session winnings
        player.totalBuyIn += amountToAdd;

        // Reset to full stack
        player.chips = targetAmount;

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
