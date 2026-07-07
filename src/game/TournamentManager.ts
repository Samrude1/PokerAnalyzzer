import { PokerGame } from './PokerGame';
import { Player, TournamentState, TournamentConfig, BlindLevel, BotDifficulty } from './types';

// Default Blind Structure
const DEFAULT_BLIND_STRUCTURE: BlindLevel[] = [
    { level: 1, smallBlind: 10, bigBlind: 20 },
    { level: 2, smallBlind: 15, bigBlind: 30 },
    { level: 3, smallBlind: 25, bigBlind: 50 },
    { level: 4, smallBlind: 50, bigBlind: 100 },
    { level: 5, smallBlind: 75, bigBlind: 150 },
    { level: 6, smallBlind: 100, bigBlind: 200 },
    { level: 7, smallBlind: 150, bigBlind: 300 },
    { level: 8, smallBlind: 200, bigBlind: 400 },
    { level: 9, smallBlind: 300, bigBlind: 600 },
    { level: 10, smallBlind: 500, bigBlind: 1000 },
    { level: 11, smallBlind: 1000, bigBlind: 2000 },
    { level: 12, smallBlind: 1500, bigBlind: 3000 },
    { level: 13, smallBlind: 2000, bigBlind: 4000 },
    { level: 14, smallBlind: 3000, bigBlind: 6000 },
    { level: 15, smallBlind: 5000, bigBlind: 10000 },
];

export class TournamentManager {
    state: TournamentState;
    config: TournamentConfig;
    tables: PokerGame[];
    allPlayers: Player[];

    constructor(hero: Player, config: TournamentConfig, tableType: BotDifficulty | 'mixed' = 'mixed') {
        this.config = config;
        
        // Setup State
        this.state = {
            id: crypto.randomUUID(),
            isActive: true,
            currentLevel: 1,
            totalHandsPlayed: 0,
            playersRemaining: config.playersCount,
            averageStack: config.startingChips,
            blindStructure: DEFAULT_BLIND_STRUCTURE,
            payouts: this.calculatePayouts(config.playersCount, config.buyIn)
        };

        this.tables = [];
        this.allPlayers = [hero];

        // Ensure Hero starts with config chips
        hero.chips = config.startingChips;
        hero.initialChips = config.startingChips;
        hero.totalBuyIn = config.buyIn;

        // Generate Bot Players
        const botNames = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy', 'Mallory', 'Oscar', 'Peggy', 'Sybil', 'Trent', 'Victor', 'Walter', 'Xavier', 'Yvonne', 'Zelda', 'Arthur', 'Bruce', 'Clark', 'Diana', 'Barry', 'Hal', 'Arthur', 'Oliver', 'Dinah', 'Ray', 'John', 'Shayera', 'J\'onn', 'Carter', 'Kendra', 'Mari', 'Billy', 'Victor', 'Garfield', 'Rachel', 'Koriand\'r', 'Dick', 'Jason', 'Tim', 'Damian', 'Barbara', 'Stephanie', 'Cassandra', 'Helena', 'Selina'];
        const allDifficulties: BotDifficulty[] = ['beginner', 'intermediate', 'advanced', 'pro'];

        for (let i = 1; i < config.playersCount; i++) {
            const diff = tableType === 'mixed' 
                ? allDifficulties[Math.floor(Math.random() * allDifficulties.length)]
                : tableType;

            const bot: Player = {
                id: `bot_${crypto.randomUUID()}`,
                name: botNames[i % botNames.length] + `_${i}`,
                chips: config.startingChips,
                initialChips: config.startingChips,
                totalBuyIn: config.buyIn,
                difficulty: diff,
                cards: [],
                status: 'active',
                currentBet: 0,
                role: 'none',
                isHuman: false,
                hasActed: false,
                stats: {
                    vpip: 0, pfr: 0, af: 0, handsPlayed: 0, handsWon: 0,
                    vpipCount: 0, pfrCount: 0, threeBetCount: 0, threeBetOpportunity: 0,
                    aggressionsCount: 0, callsCount: 0, sessionPnL: 0, showdownsReached: 0, showdownsWon: 0
                },
                handContribution: 0
            };
            this.allPlayers.push(bot);
        }

        // Shuffle Players
        this.allPlayers.sort(() => Math.random() - 0.5);

        this.balanceTables();
    }

    private calculatePayouts(playersCount: number, buyIn: number): number[] {
        const prizePool = playersCount * buyIn;
        // Payout ~15% of field
        const paidSpots = Math.max(1, Math.floor(playersCount * 0.15));
        
        if (paidSpots === 1) return [prizePool];
        if (paidSpots === 2) return [prizePool * 0.65, prizePool * 0.35];
        if (paidSpots === 3) return [prizePool * 0.5, prizePool * 0.3, prizePool * 0.2];
        
        // Simple curve for > 3 spots
        let remainingPool = prizePool;
        const payouts = [];
        let share = 0.40; // Winner gets 40%
        for(let i=0; i<paidSpots; i++) {
            if (i === paidSpots - 1) {
                payouts.push(Math.floor(remainingPool));
            } else {
                const payout = Math.floor(prizePool * share);
                payouts.push(payout);
                remainingPool -= payout;
                share = share * 0.6; // Decrease share for next place
            }
        }
        return payouts;
    }

    // Assigns players to tables (up to 9-max)
    balanceTables() {
        const activePlayers = this.allPlayers.filter(p => p.chips > 0);
        this.state.playersRemaining = activePlayers.length;

        // Calculate average stack
        const totalChips = activePlayers.reduce((sum, p) => sum + p.chips, 0);
        this.state.averageStack = totalChips / activePlayers.length;

        if (activePlayers.length <= 1) {
            this.state.isActive = false;
            return;
        }

        const maxPerTable = 9;
        const numTables = Math.ceil(activePlayers.length / maxPerTable);
        
        const newTables: PokerGame[] = [];
        const currentLevel = this.state.blindStructure[this.state.currentLevel - 1] || this.state.blindStructure[this.state.blindStructure.length - 1];

        const tableGroups: Player[][] = Array.from({ length: numTables }, () => []);
        
        // Distribute active players evenly
        activePlayers.forEach((p, idx) => {
            tableGroups[idx % numTables].push(p);
        });

        tableGroups.forEach(group => {
            const table = new PokerGame(group, true);
            table.setBlinds(currentLevel.smallBlind, currentLevel.bigBlind);
            newTables.push(table);
        });

        this.tables = newTables;
    }

    // Called after every hand played by the Hero
    advanceTournament() {
        if (!this.state.isActive) return;

        this.state.totalHandsPlayed++;

        // Check for Blind Level Increase
        if (this.state.totalHandsPlayed % this.config.handsPerLevel === 0) {
            if (this.state.currentLevel < this.state.blindStructure.length) {
                this.state.currentLevel++;
            }
        }

        const currentLevel = this.state.blindStructure[this.state.currentLevel - 1];

        // 1. Advance all non-hero tables by 1 hand
        this.tables.forEach(table => {
            const hasHero = table.state.players.some(p => p.isHuman);
            table.setBlinds(currentLevel.smallBlind, currentLevel.bigBlind);

            if (!hasHero && !table.state.isGameOver) {
                table.autoPlayHand();
            }
        });

        // 2. Cleanup eliminated players and Check Table Balancing
        const activePlayersCount = this.allPlayers.filter(p => p.chips > 0).length;

        // Track Hero Placement if they busted or won
        const hero = this.allPlayers.find(p => p.isHuman);
        if (hero && hero.chips === 0 && !this.state.heroPlacement) {
            this.state.heroPlacement = activePlayersCount + 1;
            this.state.heroPrize = this.state.payouts[this.state.heroPlacement - 1] || 0;
        } else if (hero && activePlayersCount === 1 && hero.chips > 0 && !this.state.heroPlacement) {
            this.state.heroPlacement = 1;
            this.state.heroPrize = this.state.payouts[0] || 0;
        }

        if (activePlayersCount !== this.state.playersRemaining) {
            this.state.playersRemaining = activePlayersCount;
            const numTablesNeeded = Math.ceil(activePlayersCount / 9);
            const currentTableCount = this.tables.length;
            
            // Re-balance ONLY when we need fewer tables to avoid constant reseating
            const needsRebalance = (numTablesNeeded < currentTableCount);

            if (needsRebalance) {
                this.balanceTables();
            } else if (currentTableCount > 1) {
                const tableSizes = this.tables.map(t => t.state.players.filter(p => p.chips > 0).length);
                const max = Math.max(...tableSizes);
                const min = Math.min(...tableSizes);
                if (max - min >= 2) {
                    this.balanceTables();
                }
            }
        }

        // Calculate Average Stack
        const totalChips = this.allPlayers.filter(p => p.chips > 0).reduce((sum, p) => sum + p.chips, 0);
        this.state.averageStack = Math.floor(totalChips / Math.max(1, this.state.playersRemaining));

        if (this.state.playersRemaining <= 1) {
            this.state.isActive = false;
        }
    }

    getHeroTable(): PokerGame | undefined {
        return this.tables.find(t => t.state.players.some(p => p.isHuman));
    }
}
