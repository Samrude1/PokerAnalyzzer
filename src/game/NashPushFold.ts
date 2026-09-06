import { Card, Rank } from './Deck';
import { Position } from './types';

export interface PushFoldEvaluation {
    isPush: boolean;
    handNotation: string;
    position: Position;
    stackBB: number;
    maxBB: number;
    diffBB: number; // stackBB - maxBB
    verdict: 'PUSH' | 'FOLD';
    explanation: string;
}

export interface TrainingScenario {
    id: string;
    heroCards: Card[];
    handNotation: string;
    position: Position;
    stackBB: number;
    blinds: { sb: number; bb: number };
    correctAction: 'PUSH' | 'FOLD';
    maxBB: number;
    explanation: string;
}

export interface RangeMatrixCell {
    name: string;
    type: 'pair' | 'suited' | 'offsuit';
    row: number;
    col: number;
    maxBBByPosition: Record<string, number>;
}

const RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

const RANK_VALUES: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Nash Equilibrium Sklansky-Chubukov profitable push thresholds (in Big Blinds)
// Format: [SB, BTN, CO, MP, UTG]
const NASH_TABLE: Record<string, [number, number, number, number, number]> = {
    // Pocket Pairs
    'AA': [50, 50, 50, 50, 50],
    'KK': [50, 50, 50, 50, 50],
    'QQ': [50, 50, 50, 50, 50],
    'JJ': [50, 50, 50, 50, 50],
    'TT': [50, 50, 50, 35, 25],
    '99': [40, 35, 25, 18, 14],
    '88': [30, 25, 18, 14, 11],
    '77': [24, 20, 14, 11, 9.5],
    '66': [20, 16, 12, 9.5, 8.0],
    '55': [17, 13, 10, 8.0, 6.5],
    '44': [14, 11, 8.5, 6.5, 5.0],
    '33': [12, 9.5, 7.0, 5.5, 4.2],
    '22': [10, 8.0, 6.0, 4.8, 3.8],

    // Suited Aces
    'AKs': [50, 50, 50, 50, 50],
    'AQs': [50, 50, 50, 40, 30],
    'AJs': [50, 45, 35, 25, 18],
    'ATs': [40, 30, 22, 16, 13],
    'A9s': [30, 22, 16, 12, 9.5],
    'A8s': [25, 18, 13, 10, 8.0],
    'A7s': [22, 16, 12, 9.0, 7.2],
    'A6s': [20, 14, 10.5, 8.2, 6.5],
    'A5s': [22, 16, 12, 9.2, 7.5],
    'A4s': [20, 14, 11, 8.5, 6.8],
    'A3s': [18, 13, 10, 7.8, 6.0],
    'A2s': [16, 12, 9.0, 7.0, 5.5],

    // Offsuit Aces
    'AKo': [50, 50, 50, 40, 30],
    'AQo': [50, 40, 30, 22, 16],
    'AJo': [35, 25, 18, 14, 11],
    'ATo': [25, 18, 13, 10, 8.0],
    'A9o': [18, 13, 9.5, 7.5, 5.8],
    'A8o': [15, 11, 8.0, 6.2, 4.8],
    'A7o': [13, 9.2, 6.8, 5.2, 3.8],
    'A6o': [11, 8.0, 5.8, 4.4, 3.0],
    'A5o': [12, 8.8, 6.4, 4.8, 3.5],
    'A4o': [11, 7.8, 5.6, 4.2, 3.0],
    'A3o': [9.5, 6.8, 4.8, 3.6, 2.5],
    'A2o': [8.5, 6.0, 4.2, 3.0, 2.0],

    // Suited Kings
    'KQs': [45, 35, 25, 18, 14],
    'KJs': [35, 25, 18, 13, 10],
    'KTs': [28, 20, 14, 10.5, 8.0],
    'K9s': [20, 14, 10, 7.5, 5.8],
    'K8s': [16, 11, 8.0, 6.0, 4.5],
    'K7s': [13, 9.2, 6.5, 4.8, 3.5],
    'K6s': [11, 7.8, 5.5, 4.0, 2.8],
    'K5s': [10, 7.0, 5.0, 3.5, 2.5],
    'K4s': [9.0, 6.2, 4.4, 3.0, 2.0],
    'K3s': [8.0, 5.5, 3.8, 2.5, 1.8],
    'K2s': [7.2, 5.0, 3.5, 2.2, 1.5],

    // Offsuit Kings
    'KQo': [30, 22, 16, 12, 9.0],
    'KJo': [22, 15, 11, 8.2, 6.2],
    'KTo': [16, 11, 8.0, 6.0, 4.5],
    'K9o': [11, 7.5, 5.2, 3.8, 2.5],
    'K8o': [8.5, 5.8, 3.8, 2.6, 1.8],
    'K7o': [7.0, 4.8, 3.0, 2.0, 1.2],
    'K6o': [5.8, 3.8, 2.4, 1.5, 1.0],
    'K5o': [5.2, 3.4, 2.0, 1.2, 0.8],
    'K4o': [4.6, 3.0, 1.8, 1.0, 0.6],
    'K3o': [4.0, 2.5, 1.5, 0.8, 0.5],
    'K2o': [3.5, 2.2, 1.2, 0.6, 0.4],

    // Suited Queens
    'QJs': [30, 22, 16, 11.5, 8.8],
    'QTs': [24, 17, 12, 8.8, 6.8],
    'Q9s': [17, 12, 8.5, 6.2, 4.8],
    'Q8s': [13, 9.0, 6.4, 4.6, 3.4],
    'Q7s': [10, 7.0, 4.8, 3.4, 2.4],
    'Q6s': [8.5, 5.8, 3.8, 2.6, 1.8],
    'Q5s': [7.5, 5.0, 3.2, 2.2, 1.5],
    'Q4s': [6.5, 4.2, 2.8, 1.8, 1.2],
    'Q3s': [5.8, 3.8, 2.4, 1.5, 1.0],
    'Q2s': [5.2, 3.4, 2.0, 1.2, 0.8],

    // Offsuit Queens
    'QJo': [18, 12, 8.8, 6.4, 4.8],
    'QTo': [13, 9.0, 6.2, 4.5, 3.2],
    'Q9o': [9.0, 6.0, 4.0, 2.8, 1.8],
    'Q8o': [6.8, 4.5, 2.8, 1.8, 1.2],
    'Q7o': [5.2, 3.2, 2.0, 1.2, 0.8],
    'Q6o': [4.2, 2.6, 1.5, 0.8, 0.5],
    'Q5o': [3.6, 2.2, 1.2, 0.6, 0.3],
    'Q4o': [3.0, 1.8, 1.0, 0.5, 0.2],
    'Q3o': [2.6, 1.5, 0.8, 0.4, 0.2],
    'Q2o': [2.2, 1.2, 0.6, 0.3, 0.1],

    // Suited Jacks & Connectors
    'JTs': [24, 17, 12, 8.5, 6.5],
    'J9s': [17, 12, 8.2, 5.8, 4.2],
    'J8s': [12, 8.5, 5.8, 4.0, 2.8],
    'J7s': [9.0, 6.2, 4.0, 2.8, 1.8],
    'J6s': [7.2, 4.8, 3.0, 2.0, 1.2],
    'J5s': [6.0, 4.0, 2.4, 1.5, 0.9],
    'J4s': [5.2, 3.4, 2.0, 1.2, 0.7],
    'J3s': [4.5, 2.8, 1.6, 0.9, 0.5],
    'J2s': [4.0, 2.5, 1.4, 0.8, 0.4],

    'JTo': [13, 8.5, 5.8, 4.0, 2.8],
    'J9o': [8.5, 5.5, 3.6, 2.4, 1.5],
    'J8o': [6.0, 3.8, 2.4, 1.5, 0.9],
    'J7o': [4.5, 2.8, 1.6, 0.9, 0.5],
    'J6o': [3.5, 2.0, 1.1, 0.6, 0.3],
    'J5o': [2.8, 1.5, 0.8, 0.4, 0.2],
    'J4o': [2.4, 1.2, 0.6, 0.3, 0.1],
    'J3o': [2.0, 1.0, 0.5, 0.2, 0.1],
    'J2o': [1.8, 0.8, 0.4, 0.2, 0.1],

    // Suited Connectors & Others
    'T9s': [18, 13, 9.0, 6.2, 4.5],
    'T8s': [13, 9.0, 6.0, 4.0, 2.8],
    'T7s': [9.5, 6.5, 4.2, 2.8, 1.8],
    'T6s': [7.0, 4.6, 2.8, 1.8, 1.1],
    'T5s': [5.5, 3.5, 2.0, 1.2, 0.7],
    'T4s': [4.5, 2.8, 1.6, 0.9, 0.5],
    'T3s': [3.8, 2.4, 1.3, 0.7, 0.4],
    'T2s': [3.4, 2.0, 1.1, 0.6, 0.3],

    'T9o': [9.5, 6.0, 4.0, 2.6, 1.7],
    'T8o': [6.5, 4.0, 2.5, 1.5, 0.9],
    'T7o': [4.8, 2.8, 1.6, 0.9, 0.5],
    'T6o': [3.4, 1.9, 1.0, 0.5, 0.3],
    'T5o': [2.6, 1.4, 0.7, 0.3, 0.2],
    'T4o': [2.2, 1.1, 0.5, 0.2, 0.1],
    'T3o': [1.8, 0.9, 0.4, 0.2, 0.1],
    'T2o': [1.5, 0.7, 0.3, 0.1, 0.1],

    '98s': [15, 10.5, 7.0, 4.8, 3.2],
    '97s': [10, 7.0, 4.5, 3.0, 1.9],
    '96s': [7.5, 5.0, 3.0, 1.9, 1.1],
    '95s': [5.5, 3.4, 2.0, 1.2, 0.6],
    '94s': [4.2, 2.5, 1.4, 0.8, 0.4],
    '93s': [3.5, 2.0, 1.1, 0.6, 0.3],
    '92s': [3.0, 1.8, 0.9, 0.5, 0.2],

    '98o': [7.5, 4.8, 3.0, 1.9, 1.1],
    '97o': [5.0, 3.0, 1.8, 1.0, 0.5],
    '96o': [3.5, 2.0, 1.1, 0.6, 0.3],
    '95o': [2.6, 1.4, 0.7, 0.3, 0.1],
    '94o': [2.0, 1.0, 0.5, 0.2, 0.1],
    '93o': [1.6, 0.8, 0.3, 0.1, 0.1],
    '92o': [1.4, 0.6, 0.3, 0.1, 0.1],

    '87s': [13, 9.0, 5.8, 3.8, 2.4],
    '86s': [9.0, 6.0, 3.8, 2.4, 1.4],
    '85s': [6.5, 4.2, 2.5, 1.5, 0.8],
    '84s': [4.5, 2.8, 1.6, 0.9, 0.4],
    '83s': [3.5, 2.0, 1.1, 0.5, 0.2],
    '82s': [2.8, 1.6, 0.8, 0.4, 0.2],

    '87o': [6.0, 3.8, 2.2, 1.3, 0.7],
    '86o': [4.2, 2.5, 1.4, 0.7, 0.4],
    '85o': [2.9, 1.6, 0.9, 0.4, 0.2],
    '84o': [2.0, 1.0, 0.5, 0.2, 0.1],
    '83o': [1.6, 0.7, 0.3, 0.1, 0.1],
    '82o': [1.3, 0.5, 0.2, 0.1, 0.1],

    '76s': [11, 7.5, 4.8, 3.0, 1.8],
    '75s': [8.0, 5.2, 3.2, 1.9, 1.1],
    '74s': [5.5, 3.4, 2.0, 1.1, 0.6],
    '73s': [3.8, 2.2, 1.2, 0.6, 0.3],
    '72s': [2.8, 1.6, 0.8, 0.4, 0.2],

    '76o': [4.8, 3.0, 1.7, 0.9, 0.5],
    '75o': [3.4, 2.0, 1.1, 0.5, 0.2],
    '74o': [2.3, 1.2, 0.6, 0.3, 0.1],
    '73o': [1.6, 0.8, 0.3, 0.1, 0.1],
    '72o': [1.2, 0.5, 0.2, 0.1, 0.1],

    '65s': [9.5, 6.4, 4.0, 2.4, 1.4],
    '64s': [6.8, 4.4, 2.6, 1.5, 0.8],
    '63s': [4.6, 2.8, 1.5, 0.8, 0.4],
    '62s': [3.2, 1.8, 0.9, 0.4, 0.2],

    '65o': [4.0, 2.4, 1.3, 0.7, 0.3],
    '64o': [2.8, 1.5, 0.8, 0.4, 0.1],
    '63o': [1.8, 0.9, 0.4, 0.2, 0.1],
    '62o': [1.4, 0.6, 0.2, 0.1, 0.1],

    '54s': [8.0, 5.2, 3.2, 1.8, 1.0],
    '53s': [5.8, 3.6, 2.0, 1.1, 0.6],
    '52s': [4.0, 2.4, 1.2, 0.6, 0.3],

    '54o': [3.2, 1.8, 0.9, 0.4, 0.2],
    '53o': [2.2, 1.1, 0.5, 0.2, 0.1],
    '52o': [1.5, 0.7, 0.3, 0.1, 0.1],

    '43s': [6.2, 3.8, 2.2, 1.2, 0.6],
    '42s': [4.5, 2.6, 1.4, 0.7, 0.3],

    '43o': [2.4, 1.2, 0.6, 0.2, 0.1],
    '42o': [1.6, 0.8, 0.3, 0.1, 0.1],

    '32s': [5.0, 3.0, 1.6, 0.8, 0.4],
    '32o': [1.8, 0.8, 0.3, 0.1, 0.1]
};

const POSITION_INDEX_MAP: Record<Position, number> = {
    'SB': 0,
    'BTN': 1,
    'CO': 2,
    'HJ': 3,
    'MP': 3,
    'UTG+2': 4,
    'UTG+1': 4,
    'UTG': 4,
    'BB': 0 // Defense/call benchmark
};

export class NashPushFold {
    /**
     * Converts two cards into standard hand notation (e.g., 'AKs', 'AKo', '77')
     */
    static getHandNotation(cards: Card[]): string {
        if (cards.length !== 2) return '';
        const c1 = cards[0];
        const c2 = cards[1];

        const v1 = RANK_VALUES[c1.rank];
        const v2 = RANK_VALUES[c2.rank];

        const highCard = v1 >= v2 ? c1 : c2;
        const lowCard = v1 >= v2 ? c2 : c1;

        if (highCard.rank === lowCard.rank) {
            return `${highCard.rank}${lowCard.rank}`;
        }

        const isSuited = highCard.suit === lowCard.suit;
        return `${highCard.rank}${lowCard.rank}${isSuited ? 's' : 'o'}`;
    }

    /**
     * Retrieves the max profitable push depth (in Big Blinds) for a hand from a given position
     */
    static getThreshold(handNotation: string, position: Position): number {
        const entry = NASH_TABLE[handNotation];
        if (!entry) return 0;
        const posIdx = POSITION_INDEX_MAP[position] ?? 2;
        return entry[posIdx];
    }

    /**
     * Evaluates whether a push or fold is theoretically correct
     */
    static evaluate(cards: Card[], position: Position, stackBB: number): PushFoldEvaluation {
        const notation = this.getHandNotation(cards);
        const maxBB = this.getThreshold(notation, position);
        const isPush = stackBB <= maxBB;
        const diffBB = Math.round((stackBB - maxBB) * 10) / 10;

        let explanation = '';
        if (isPush) {
            explanation = `PUSH: In Nash equilibrium, ${notation} is profitable to shove from ${position} with up to ${maxBB} BB (you have ${stackBB} BB). Shoving yields positive EV against unexploitative blinds.`;
        } else {
            explanation = `FOLD: ${notation} from ${position} is only profitable to open-shove with ≤ ${maxBB} BB. With ${stackBB} BB, shoving risks too many chips for the blinds and folds out worse while getting called by better.`;
        }

        return {
            isPush,
            handNotation: notation,
            position,
            stackBB,
            maxBB,
            diffBB,
            verdict: isPush ? 'PUSH' : 'FOLD',
            explanation
        };
    }

    /**
     * Generates an interactive Push/Fold training scenario
     */
    static generateScenario(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): TrainingScenario {
        const positions: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB'];
        const randomPos = positions[Math.floor(Math.random() * positions.length)];

        // Select a random hand combo
        const allHands = Object.keys(NASH_TABLE);
        const randomNotation = allHands[Math.floor(Math.random() * allHands.length)];
        const maxBB = this.getThreshold(randomNotation, randomPos);

        // Generate a stackBB near the threshold depending on difficulty
        let stackBB = 10;
        if (difficulty === 'easy') {
            // Far from threshold (> 5 BB away)
            const push = Math.random() < 0.5;
            stackBB = push ? Math.max(3, Math.round(maxBB * 0.5)) : Math.round(maxBB + 6 + Math.random() * 5);
        } else if (difficulty === 'medium') {
            // Within 2-4 BB of threshold
            const delta = (Math.random() * 4 - 2);
            stackBB = Math.max(3, Math.min(20, Math.round((maxBB + delta) * 10) / 10));
        } else {
            // Razor thin borderline decision (within 1 BB)
            const delta = (Math.random() * 1.6 - 0.8);
            stackBB = Math.max(3, Math.min(20, Math.round((maxBB + delta) * 10) / 10));
        }

        // Generate actual Card objects matching the notation
        const heroCards = this.cardsFromNotation(randomNotation);
        const evalResult = this.evaluate(heroCards, randomPos, stackBB);

        return {
            id: `drill_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            heroCards,
            handNotation: randomNotation,
            position: randomPos,
            stackBB,
            blinds: { sb: 100, bb: 200 },
            correctAction: evalResult.verdict,
            maxBB,
            explanation: evalResult.explanation
        };
    }

    /**
     * Returns complete 13x13 matrix representation for Range Visualizer
     */
    static getMatrix(): RangeMatrixCell[][] {
        const grid: RangeMatrixCell[][] = [];

        for (let r = 0; r < 13; r++) {
            const row: RangeMatrixCell[] = [];
            for (let c = 0; c < 13; c++) {
                const r1 = RANKS[r];
                const r2 = RANKS[c];
                let name = '';
                let type: 'pair' | 'suited' | 'offsuit' = 'offsuit';

                if (r === c) {
                    name = `${r1}${r2}`;
                    type = 'pair';
                } else if (r < c) {
                    name = `${r1}${r2}s`;
                    type = 'suited';
                } else {
                    name = `${r2}${r1}o`;
                    type = 'offsuit';
                }

                const entry = NASH_TABLE[name] || [0, 0, 0, 0, 0];
                const maxBBByPosition = {
                    'SB': entry[0],
                    'BTN': entry[1],
                    'CO': entry[2],
                    'MP': entry[3],
                    'UTG': entry[4]
                };

                row.push({ name, type, row: r, col: c, maxBBByPosition });
            }
            grid.push(row);
        }

        return grid;
    }

    private static cardsFromNotation(notation: string): Card[] {
        const r1 = notation[0] as Rank;
        const r2 = notation[1] as Rank;
        const isSuited = notation.endsWith('s');

        if (r1 === r2) {
            // Pair
            return [
                { rank: r1, suit: 's' },
                { rank: r2, suit: 'h' }
            ];
        }

        if (isSuited) {
            return [
                { rank: r1, suit: 's' },
                { rank: r2, suit: 's' }
            ];
        }

        // Offsuit
        return [
            { rank: r1, suit: 's' },
            { rank: r2, suit: 'd' }
        ];
    }
}
