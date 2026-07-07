export interface SavedSession {
    id: string;
    userId: string;
    date: string;
    handsPlayed: number;
    chipsWon: number;
    difficulty: string;
    mode?: 'cash' | 'tournament';
    buyInAmount?: number;
    prizeWon?: number;
    placement?: number;
    totalPlayers?: number;
}

export interface SavedHand {
    id: string;
    sessionId: string;
    handNumber: number;
    timestamp: string;
    heroPosition?: string;
    heroCards: string[];
    boardCards: string[];
    potSize: number;
    result: number;
    actionLog: string[];
}

export class StorageService {
    static async saveSession(session: SavedSession): Promise<void> {
        try {
            await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(session)
            });
        } catch (e) {
            console.error("Failed to save session", e);
        }
    }

    static async getSessions(userId?: string): Promise<SavedSession[]> {
        if (!userId) return [];
        try {
            const res = await fetch(`/api/sessions/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return await res.json();
        } catch (e) {
            console.error("Failed to load sessions", e);
            return [];
        }
    }

    static async saveHand(hand: SavedHand): Promise<void> {
        return this.saveHands([hand]);
    }

    static async saveHands(newHands: SavedHand[]): Promise<void> {
        try {
            await fetch('/api/hands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hands: newHands })
            });
        } catch (e) {
            console.error("Failed to save hands", e);
        }
    }

    static async getHands(sessionId?: string): Promise<SavedHand[]> {
        if (!sessionId) return [];
        try {
            const res = await fetch(`/api/hands/${sessionId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return await res.json();
        } catch (e) {
            console.error("Failed to load hands", e);
            return [];
        }
    }

    static clearAll(): void {
        // Not implementing clearAll for the API to prevent accidental wipes.
    }
}
