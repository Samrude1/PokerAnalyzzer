import { describe, it, expect } from 'vitest';
import { HandHistoryParser } from './HandHistoryParser';
import { SavedHand } from '../services/StorageService';

describe('HandHistoryParser - Positional Logic', () => {
    it('should correctly identify Hero position as BTN', () => {
        const handText = `
PokerStars Hand #222201993922:  Hold'em No Limit ($0.01/$0.02 USD) - 2021/01/01 12:00:00 ET
Table 'Seginus II' 6-max Seat #1 is the button
Seat 1: Hero ($2.00 in chips)
Seat 2: Villain1 ($2.00 in chips)
Seat 3: Villain2 ($2.00 in chips)
Seat 4: Villain3 ($2.00 in chips)
Seat 5: Villain4 ($2.00 in chips)
Seat 6: Villain5 ($2.00 in chips)
Hero: posts small blind $0.01
Villain1: posts big blind $0.02
*** HOLE CARDS ***
Dealt to Hero [Ah Ks]
Hero: raises $0.04 to $0.06
Villain1: folds
*** SUMMARY ***
Total pot $0.04 | Rake $0.00
Seat 1: Hero collected ($0.04)
        `; // Note: Logic is simplified, usually SB is after button. 
        // If Seat 1 is Button, then Seat 2 is SB.
        // Wait, my logic is: (HeroSeat - ButtonSeat + 6) % 6
        // 1 - 1 = 0 -> BTN. Correct.

        const result = HandHistoryParser.parsePokerStars(handText, 'Hero');
        expect(result.hands).toHaveLength(1);
        expect(result.hands[0].heroPosition).toBe('BTN');
    });

    it('should correctly identify Hero position as BB', () => {
        // Button at Seat 6. Hero at Seat 2.
        // (2 - 6 + 6) % 6 = 2 -> BB. Correct.
        const handText = `
PokerStars Hand #222201993923:  Hold'em No Limit ($0.01/$0.02 USD) - 2021/01/01 12:01:00 ET
Table 'Seginus II' 6-max Seat #6 is the button
Seat 1: Villain1 ($2.00 in chips)
Seat 2: Hero ($2.00 in chips)
*** HOLE CARDS ***
Dealt to Hero [Ah Ks]
*** SUMMARY ***
Total pot $0.04
Seat 2: Hero collected ($0.04)
        `;
        const result = HandHistoryParser.parsePokerStars(handText, 'Hero');
        expect(result.hands[0].heroPosition).toBe('BB');
    });

    it('should correctly identify Hero position as UTG', () => {
        // Button at Seat 6. Hero at Seat 3.
        // (3 - 6 + 6) % 6 = 3 -> UTG. Correct.
        const handText = `
PokerStars Hand #222201993924:  Hold'em No Limit ($0.01/$0.02 USD) - 2021/01/01 12:02:00 ET
Table 'Seginus II' 6-max Seat #6 is the button
Seat 3: Hero ($2.00 in chips)
*** HOLE CARDS ***
Dealt to Hero [Ah Ks]
*** SUMMARY ***
Total pot $0.04
Seat 3: Hero collected ($0.04)
        `;
        const result = HandHistoryParser.parsePokerStars(handText, 'Hero');
        expect(result.hands[0].heroPosition).toBe('UTG');
    });
});
