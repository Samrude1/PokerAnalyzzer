export interface SavedSession {
    id: string;
    userId: string;
    date: string;
    handsPlayed: number;
    chipsWon: number;
    difficulty: string;
    mode?: 'cash' | 'tournament' | 'sng';
    buyInAmount?: number;
    prizeWon?: number;
    placement?: number;
    totalPlayers?: number;
    // Lifetime stats counters
    vpipCount?: number;
    pfrCount?: number;
    threeBetCount?: number;
    threeBetOpportunity?: number;
    aggressionsCount?: number;
    callsCount?: number;
    sawFlopCount?: number;
    wonWhenSawFlopCount?: number;
    cbetFlopOpp?: number;
    cbetFlopCount?: number;
    cbetTurnOpp?: number;
    cbetTurnCount?: number;
    cbetRiverOpp?: number;
    cbetRiverCount?: number;
    stealOpp?: number;
    stealCount?: number;
    foldToStealOpp?: number;
    foldToStealCount?: number;
    foldToThreeBetOpp?: number;
    foldToThreeBetCount?: number;
    showdownsReached?: number;
    showdownsWon?: number;
    positionalStats?: Record<string, {
        handsPlayed: number;
        vpipCount: number;
        pfrCount: number;
        threeBetCount: number;
        stealOpp: number;
        stealCount: number;
        foldToStealOpp: number;
        foldToStealCount: number;
    }>;
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
    heroNetWon: number;
    heroShowdownWon: number;
    heroNonShowdownWon: number;
    actionLog: string[];
    heroHandDescription?: string;
}

export class StorageService {
    private static getHeaders(): HeadersInit {
        const token = localStorage.getItem('poker_token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    static async saveSession(session: SavedSession): Promise<void> {
        try {
            await fetch('/api/sessions', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(session)
            });
        } catch (e) {
            console.error("Failed to save session", e);
        }
    }

    static async deleteSession(sessionId: string): Promise<void> {
        try {
            await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
        } catch (e) {
            console.error("Failed to delete session", e);
        }
    }

    static async getSessions(_userId?: string): Promise<SavedSession[]> {
        // _userId parameter kept for backwards compatibility but not sent to API
        try {
            const res = await fetch(`/api/sessions`, {
                headers: this.getHeaders()
            });
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
                headers: this.getHeaders(),
                body: JSON.stringify({ hands: newHands })
            });
        } catch (e) {
            console.error("Failed to save hands", e);
        }
    }

    static async getHands(sessionId?: string): Promise<SavedHand[]> {
        if (!sessionId) return [];
        try {
            const res = await fetch(`/api/hands/${sessionId}`, {
                headers: this.getHeaders()
            });
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
