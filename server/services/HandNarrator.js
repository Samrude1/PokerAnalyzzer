const suitSymbols = { 's': '♠', 'h': '♥', 'd': '♦', 'c': '♣' };

function formatCard(cardStr) {
    if (!cardStr || cardStr.length < 2) return cardStr;
    const rank = cardStr.substring(0, cardStr.length - 1);
    const suit = cardStr[cardStr.length - 1].toLowerCase();
    return `${rank}${suitSymbols[suit] || suit}`;
}

function formatCards(cards) {
    if (!Array.isArray(cards)) return '';
    return cards.map(formatCard).join(' ');
}

export class HandNarrator {
    static narrateHand(hand, username = "Player") {
        let narrative = `Hand #${hand.handNumber}\n`;
        
        const position = hand.heroPosition ? `at ${hand.heroPosition}` : "at unknown position";
        narrative += `You (Hero) were ${position} holding [${formatCards(hand.heroCards)}].\n`;
        
        narrative += `Final Pot Size: ${hand.potSize} chips.\n`;
        
        if (hand.boardCards && hand.boardCards.length > 0) {
            narrative += `Community cards: [${formatCards(hand.boardCards)}].\n`;
        }

        if (hand.actionLog && hand.actionLog.length > 0) {
            narrative += `\nAction Log:\n`;
            
            // Regex to safely replace the username at the start of an action line
            const usernameRegex = new RegExp(`^${username}\\b`, 'i');
            
            hand.actionLog.forEach(action => {
                let cleaned = action.replace(usernameRegex, 'You (Hero)');
                
                // Format cards in parentheses, e.g. (8s6c) -> [8♠ 6♣]
                cleaned = cleaned.replace(/\(([^)]+)\)/g, (match, p1) => {
                    if (p1.length % 2 === 0 && !p1.includes(' ')) {
                        const cards = p1.match(/.{2}/g);
                        if (cards) return `[${formatCards(cards)}]`;
                    }
                    return match;
                });
                
                narrative += `- ${cleaned}\n`;
            });
        }

        const result = hand.heroNetWon > 0 
            ? `You won ${hand.heroNetWon} chips.` 
            : (hand.heroNetWon < 0 ? `You lost ${Math.abs(hand.heroNetWon)} chips.` : `You broke even.`);
            
        narrative += `\nResult: ${result}\n`;

        return narrative;
    }

    static narrateSession(session, username = "Player") {
        let narrative = `Session Summary (${new Date(session.date).toLocaleDateString()})\n`;
        narrative += `Played ${session.handsPlayed} hands on ${session.difficulty} difficulty.\n`;
        
        const result = session.chipsWon > 0 
            ? `Won ${session.chipsWon} chips.` 
            : (session.chipsWon < 0 ? `Lost ${Math.abs(session.chipsWon)} chips.` : `Broke even.`);
        narrative += `Session Result: ${result}\n`;

        if (session.vpipCount !== undefined && session.handsPlayed > 0) {
            const vpip = ((session.vpipCount / session.handsPlayed) * 100).toFixed(1);
            const pfr = ((session.pfrCount / session.handsPlayed) * 100).toFixed(1);
            narrative += `Stats: VPIP ${vpip}%, PFR ${pfr}%.\n`;
        }

        return narrative;
    }
}
