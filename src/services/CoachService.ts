export class CoachService {
    static async checkHealth() {
        try {
            const res = await fetch('http://localhost:3001/api/coach/health');
            if (!res.ok) return { status: 'offline' };
            return await res.json();
        } catch (e) {
            return { status: 'offline' };
        }
    }

    static async indexData(userId: string) {
        try {
            const res = await fetch('http://localhost:3001/api/coach/index', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            return await res.json();
        } catch (e) {
            return { error: 'Failed to index' };
        }
    }

    static async sendChatMessage(userId: string, question: string, actionType: string, contextSessionId: string | null, onMessage: (text: string) => void) {
        try {
            const res = await fetch('http://localhost:3001/api/coach/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, question, actionType, contextSessionId })
            });

            if (!res.ok) throw new Error('Chat failed');
            if (!res.body) return;

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n').filter(l => l.trim() !== '');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.message && data.message.content) {
                                onMessage(data.message.content);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data', e);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            onMessage("\n\n[Error communicating with Coach]");
        }
    }
}
