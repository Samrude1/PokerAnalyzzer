

export interface SavedSession {
    id: string;
    userId: string;
    date: string;
    handsPlayed: number;
    chipsWon: number;
    difficulty: string;
}

export interface SavedHand {
    id: string;
    sessionId: string;
    handNumber: number;
    timestamp: string;
    heroPosition?: string; // Stored as string to avoid circular dependency, but logically is Position
    heroCards: string[];
    boardCards: string[];
    potSize: number;
    result: number; // Net profit/loss
    actionLog: string[];
}

const STORAGE_KEYS = {
    SESSIONS: 'poker_sessions',
    HANDS: 'poker_hands'
};

export class StorageService {
    static saveSession(session: SavedSession): void {
        const sessions = this.getSessions();
        sessions.push(session);
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }

    static getSessions(userId?: string): SavedSession[] {
        const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        if (!stored) return [];
        try {
            const sessions: SavedSession[] = JSON.parse(stored);
            if (userId) {
                return sessions.filter(s => s.userId === userId);
            }
            return sessions;
        } catch (e) {
            console.error("Failed to load sessions", e);
            return [];
        }
    }

    static saveHand(hand: SavedHand): void {
        const hands = this.getHands();
        hands.push(hand);
        localStorage.setItem(STORAGE_KEYS.HANDS, JSON.stringify(hands));
    }

    static saveHands(newHands: SavedHand[]): void {
        const hands = this.getHands();
        hands.push(...newHands);
        localStorage.setItem(STORAGE_KEYS.HANDS, JSON.stringify(hands));
    }

    static getHands(sessionId?: string): SavedHand[] {
        const stored = localStorage.getItem(STORAGE_KEYS.HANDS);
        if (!stored) return [];
        try {
            const hands: SavedHand[] = JSON.parse(stored);
            if (sessionId) {
                return hands.filter(h => h.sessionId === sessionId);
            }
            return hands;
        } catch (e) {
            console.error("Failed to load hands", e);
            return [];
        }
    }

    static clearAll(): void {
        localStorage.removeItem(STORAGE_KEYS.SESSIONS);
        localStorage.removeItem(STORAGE_KEYS.HANDS);
    }
}
