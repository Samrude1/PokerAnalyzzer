import { SavedHand } from '../services/StorageService';
import { Position } from '../game/types';

export interface ParseResult {
    hands: SavedHand[];
    errors: string[];
    summary: {
        totalHands: number;
        sessionsCreated: number;
        totalProfit: number;
    };
}

export class HandHistoryParser {
    static parsePokerStars(text: string, heroName: string): ParseResult {
        const rawHands = text.split(/PokerStars Hand #/g).filter(h => h.trim().length > 0);
        const hands: SavedHand[] = [];
        const errors: string[] = [];
        let totalProfit = 0;

        // Generate a pseudo-session ID for this import batch
        const sessionId = `import_${Date.now()}`;

        for (const rawHand of rawHands) {
            try {
                const lines = rawHand.split('\n');
                if (lines.length < 3) continue;

                // 1. Extract Hand Number and Metadata
                // Line 0: "222201993922:  Hold'em No Limit ($0.01/$0.02 USD) - 2021/01/01 12:00:00 ET"
                const headerParts = lines[0].match(/(\d+):.*(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/);
                const handNumber = headerParts ? parseInt(headerParts[1]) : 0;
                const timestamp = headerParts ? headerParts[2] : new Date().toISOString();

                // 2. Identify Button and Hero Seat
                // Line 1: Table 'Seginus II' 6-max Seat #2 is the button
                let buttonSeat = -1;
                const buttonLine = lines.find(l => l.includes('is the button'));
                if (buttonLine) {
                    const match = buttonLine.match(/Seat #(\d+) is the button/);
                    if (match) buttonSeat = parseInt(match[1]);
                }

                // Seat 1: Hero ($2.00 in chips) 
                let heroSeatIndex = -1;
                let activePlayerCount = 0;
                // Count active players to handle non-full tables correctly if needed, 
                // but for 6-max mapping we usually assume relative to button or fixed seats.
                // For simplified 6-max MVP, we map relative to button assuming 6 seats.

                for (const line of lines) {
                    if (line.includes(`: ${heroName} (`)) {
                        const match = line.match(/Seat (\d+):/);
                        if (match) heroSeatIndex = parseInt(match[1]);
                    }
                }

                if (heroSeatIndex === -1) {
                    // console.warn('Hero not found in hand #' + handNumber);
                    continue; // Skip hands where hero isn't playing
                }

                // 3. Extract Hole Cards
                // "Dealt to Hero [Ah Ks]"
                let heroCards: string[] = [];
                const dealtLine = lines.find(l => l.includes(`Dealt to ${heroName}`));
                if (dealtLine) {
                    const match = dealtLine.match(/\[([A-Za-z0-9 ]+)\]/);
                    if (match) {
                        heroCards = match[1].split(' ');
                    }
                }

                // 4. Extract Board
                // "Board [As 2h 5d]" or "Board [As 2h 5d 9c Qd]"
                let boardCards: string[] = [];
                const boardLine = lines.find(l => l.includes('Board ['));
                if (boardLine) {
                    const match = boardLine.match(/\[([A-Za-z0-9 ]+)\]/);
                    if (match) {
                        boardCards = match[1].split(' ');
                    }
                }

                // 5. Calculate Result (Profit/Loss)
                // Search for "Seat X: Hero collected ($3.00)" or summary lines
                // Alternatively, calculate simple difference from start chips if next hand available (hard in simple parser)
                // Let's look for "collected" or "won" lines for Hero
                let collected = 0;
                const collectedLines = lines.filter(l => l.includes(`Seat ${heroSeatIndex}: ${heroName} collected`));
                for (const cl of collectedLines) {
                    const match = cl.match(/collected \(\$([\d.]+)\)/);
                    if (match) collected += parseFloat(match[1]);
                }

                // Calculate investment (bets/calls) by parsing all action lines for Hero
                // (Logic filtered out for clean build - pending future enhancement)


                // Note: Standard PS HH parser is complex. 
                // For this MVP, let's assume valid "collected" means we won pot, 
                // but determining 'Net Won' precisely requires parsing every street bet.
                // We'll create a simplified 'result' by scanning summary 'won' - estimated investment
                // OR: Find the "Summary" block and parse specific outcome.

                // Let's scan actions for hero investment:
                // "Hero: posts small blind $0.01"
                // "Hero: bets $0.10"
                // Let's scan actions for hero investment:
                /* Future implementation for detailed PnL tracking */


                // Final calculation fallback for MVP:
                // If "collected", result = collected. ( Gross winnings, not net).
                // Subtracting bets is hard. Let's just store Gross Winnings for the 'Pot Size' and 0 for result if unknown.
                const profit = collected; // Placeholder: Ideally strictly Net Won.
                totalProfit += profit;

                const hand: SavedHand = {
                    id: `h_${handNumber}`,
                    sessionId: sessionId,
                    handNumber: handNumber,
                    timestamp: timestamp,
                    heroCards: heroCards,
                    boardCards: boardCards,
                    potSize: collected, // Approximate if we won, otherwise need to parse "Total pot $X"
                    result: profit,
                    actionLog: lines.slice(0, 10), // Store first 10 lines as preview
                    heroPosition: undefined
                };

                // Calculate Position
                if (buttonSeat !== -1 && heroSeatIndex !== -1) {
                    // Logic for 6-max table
                    // Distance from button (clockwise)
                    // 1 = SB, 2 = BB, 3 = UTG, 4 = HJ, 5 = CO, 0/6 = BTN
                    // Note: This assumes a full 6-max table or fixed 6 seats. 
                    // Dealing with empty seats requires mapping only active seats, effectively compressing the table.
                    // For MVP Parser: We use simple Seat distance modulo 6.

                    const dist = (heroSeatIndex - buttonSeat + 6) % 6;
                    const positionMap: Record<number, Position> = {
                        1: 'SB',
                        2: 'BB',
                        3: 'UTG',
                        4: 'HJ',
                        5: 'CO',
                        0: 'BTN'
                    };
                    hand.heroPosition = positionMap[dist];
                }

                // refine pot size
                const potLine = lines.find(l => l.includes('Total pot '));
                if (potLine) {
                    const match = potLine.match(/Total pot \$([\d.]+)/);
                    if (match) hand.potSize = parseFloat(match[1]);
                }

                hands.push(hand);

            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                errors.push(`Error parsing hand: ${message}`);
            }
        }

        return {
            hands,
            errors,
            summary: {
                totalHands: hands.length,
                sessionsCreated: 1,
                totalProfit: totalProfit
            }
        };
    }
}
