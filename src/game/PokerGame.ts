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
        if (this.checkGameOverCondition()) return;

        this.resetGameStateForNewHand();
        this.rotateDealer();
        this.resetPlayersForNewHand();

        if (this.getActivePlayers().length < 2) {
            this.state.isGameOver = true;
            return;
        }

        this.assignPositions();
        
        const { sbIdx, bbIdx, utgIdx } = this.calculateBlindIndices();
        this.postBlinds(sbIdx, bbIdx);
        this.dealHoleCards();

        this.state.activePlayerId = this.state.players[utgIdx].id;
    }

    private checkGameOverCondition(): boolean {
        const playersWithChips = this.getPlayersWithChips();
        if (playersWithChips.length <= 1) {
            this.state.isGameOver = true;
            return true;
        }
        return false;
    }

    private resetGameStateForNewHand() {
        this.deck.reset();
        this.deck.shuffle();
        this.state.pot = 0;
        this.state.communityCards = [];
        this.state.phase = 'pre-flop';
        this.state.currentBet = this.state.bigBlindAmount;
        this.state.minRaise = this.state.bigBlindAmount * 2;
        this.state.winners = [];
        this.state.winnerInfo = undefined;
        this.state.handNumber++;
        this.state.currentHandLog = [];
    }

    private rotateDealer() {
        let newDealerIdx = (this.state.dealerIndex + 1) % this.state.players.length;
        let attempts = 0;
        while (this.state.players[newDealerIdx].chips <= 0 && attempts < this.state.players.length) {
            newDealerIdx = (newDealerIdx + 1) % this.state.players.length;
            attempts++;
        }
        this.state.dealerIndex = newDealerIdx;
    }

    private resetPlayersForNewHand() {
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
    }

    private assignPositions() {
        const activeCount = this.getActivePlayers().length;
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
    }

    private calculateBlindIndices(): { sbIdx: number, bbIdx: number, utgIdx: number } {
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
        
        return { sbIdx, bbIdx, utgIdx };
    }

    private postBlinds(sbIdx: number, bbIdx: number) {
        this.postBlind(sbIdx, this.state.smallBlindAmount, 'small-blind');
        this.postBlind(bbIdx, this.state.bigBlindAmount, 'big-blind');
    }

    private dealHoleCards() {
        this.state.players.forEach(player => {
            if (player.status === 'active' || player.status === 'all-in') {
                const c1 = this.deck.deal();
                const c2 = this.deck.deal();
                if (c1 && c2) player.cards.push(c1, c2);
            }
        });
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
                if (this.handleFold(player)) return;
                break;
            case 'check':
                this.handleCheck(player);
                break;
            case 'call':
                this.handleCall(player);
                break;
            case 'raise':
                this.handleRaise(player, raiseAmount);
                break;
        }

        this.nextTurn();
    }

    private handleFold(player: Player): boolean {
        player.status = 'folded';
        const remainingActive = this.getActivePlayers();
        if (remainingActive.length === 1) {
            this.collectBets();
            this.state.phase = 'showdown';
            this.resolveShowdown();
            return true;
        }
        return false;
    }

    private handleCheck(player: Player) {
        if (this.state.currentBet > player.currentBet) {
            console.error("Invalid check - must call or fold");
        }
    }

    private handleCall(player: Player) {
        const callCost = this.state.currentBet - player.currentBet;
        const actualCall = Math.min(player.chips, callCost);
        player.chips -= actualCall;
        player.currentBet += actualCall;
        if (player.chips === 0) player.status = 'all-in';
    }

    private handleRaise(player: Player, raiseAmount?: number) {
        if (!raiseAmount) return;

        const playerStack = player.chips + player.currentBet;
        let validAmount = Math.min(raiseAmount, playerStack);

        if (validAmount < this.state.minRaise && validAmount < playerStack) {
            validAmount = Math.min(this.state.minRaise, playerStack);
        }

        if (validAmount <= this.state.currentBet) {
            this.handleCall(player);
            return;
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
    }

    private getPlayerGroups(): { active: Player[], allIn: Player[] } {
        const active: Player[] = [];
        const allIn: Player[] = [];
        for (const p of this.state.players) {
            if (p.status === 'active') active.push(p);
            else if (p.status === 'all-in') allIn.push(p);
        }
        return { active, allIn };
    }

    private nextTurn() {
        const { active: activePlayers, allIn: allInPlayers } = this.getPlayerGroups();

        if (activePlayers.length === 0 && allInPlayers.length > 1) {
            if (this.isRoundComplete(activePlayers, allInPlayers)) {
                this.collectBets();
                this.nextPhase();
            }
            return;
        }

        if (activePlayers.length === 0 || (activePlayers.length === 1 && allInPlayers.length === 0)) {
            if (this.state.phase !== 'showdown') {
                this.collectBets();
                this.state.phase = 'showdown';
                this.resolveShowdown();
            }
            return;
        }

        if (this.isRoundComplete(activePlayers, allInPlayers)) {
            this.collectBets();
            this.nextPhase();
            return;
        }

        this.advanceActivePlayer();
    }

    private advanceActivePlayer() {
        let idx = this.state.players.findIndex(p => p.id === this.state.activePlayerId);
        let nextIdx = (idx + 1) % this.state.players.length;
        let loopCount = 0;

        while (this.state.players[nextIdx].status !== 'active' && loopCount < this.state.players.length) {
            nextIdx = (nextIdx + 1) % this.state.players.length;
            loopCount++;
        }

        if (loopCount < this.state.players.length) {
            this.state.activePlayerId = this.state.players[nextIdx].id;
        }
    }

    private collectBets() {
        this.state.players.forEach(p => {
            if (p.currentBet > 0) {
                this.state.pot += p.currentBet;
                p.handContribution += p.currentBet;
                p.currentBet = 0;
            }
        });
    }

    private isRoundComplete(activePlayers: Player[], allInPlayers: Player[]): boolean {
        if (activePlayers.length === 0 && allInPlayers.length > 1) return true;
        if (activePlayers.length === 0) return true;

        if (activePlayers.length === 1 && allInPlayers.length > 0) {
            const active = activePlayers[0];
            return active.currentBet >= this.state.currentBet && active.hasActed;
        }

        const currentBet = this.state.currentBet;
        const betsMatch = activePlayers.every(p => p.currentBet === currentBet);
        const allActed = activePlayers.every(p => p.hasActed);

        return betsMatch && allActed;
    }

    private nextPhase() {
        this.state.players.forEach(p => {
            p.currentBet = 0;
            p.hasActed = false;
            p.lastAction = null;
        });
        this.state.currentBet = 0;
        this.state.minRaise = this.state.bigBlindAmount;

        const { active: activePlayers, allIn: allInPlayers } = this.getPlayerGroups();
        const needsRunout = activePlayers.length <= 1 && allInPlayers.length > 0;

        switch (this.state.phase) {
            case 'pre-flop':
                this.state.phase = 'flop';
                this.state.currentHandLog.push("--- FLOP ---");
                this.dealCommunityCards(3);
                this.markSawFlop();
                break;
            case 'flop':
                this.state.phase = 'turn';
                this.state.currentHandLog.push("--- TURN ---");
                this.dealCommunityCards(1);
                break;
            case 'turn':
                this.state.phase = 'river';
                this.state.currentHandLog.push("--- RIVER ---");
                this.dealCommunityCards(1);
                break;
            case 'river':
                this.state.phase = 'showdown';
                this.resolveShowdown();
                return;
        }

        if (needsRunout && this.state.phase !== 'showdown') {
            this.nextPhase();
            return;
        }

        if (this.state.phase !== 'showdown' && activePlayers.length > 0) {
            this.setFirstActivePlayerAfterDealer();
        }
    }

    private markSawFlop() {
        this.state.players.forEach(p => {
            if (p.status === 'active' || p.status === 'all-in') {
                p.sawFlop = true;
                if (p.stats) p.stats.sawFlopCount++;
            }
        });
    }

    private setFirstActivePlayerAfterDealer() {
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
