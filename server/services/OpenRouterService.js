export class OpenRouterService {
    /**
     * Calls the OpenRouter chat API and pipes the SSE response directly to the Express response
     */
    static async chatStream(messages, expressRes) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        const model = process.env.OPENROUTER_MODEL || '~anthropic/claude-sonnet-latest';

        if (!apiKey) {
            expressRes.status(500).json({ error: 'OpenRouter API Key is missing on the server. Please check .env file.' });
            return;
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'http://localhost:5173', // Your site URL
                    'X-Title': 'Poker AI Coach', // Your site name
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: true
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenRouter chat failed: ${err}`);
            }

            // Set up SSE headers
            expressRes.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                
                // OpenRouter SSE format is standard: data: {"id":"...","choices":[{"delta":{"content":"..."}}]}
                const lines = chunk.split('\n').filter(l => l.trim() !== '');
                
                for (const line of lines) {
                    if (line === 'data: [DONE]') {
                        expressRes.write('data: {"done": true}\n\n');
                        continue;
                    }
                    
                    if (line.startsWith('data: ')) {
                        try {
                            const parsed = JSON.parse(line.slice(6));
                            if (parsed.choices && parsed.choices.length > 0 && parsed.choices[0].delta) {
                                const content = parsed.choices[0].delta.content || '';
                                if (content) {
                                    // Send in the same format the frontend expects: {"message":{"content":"..."}}
                                    expressRes.write(`data: ${JSON.stringify({ message: { content } })}\n\n`);
                                }
                            }
                        } catch (e) {
                            // ignore malformed lines
                        }
                    }
                }
            }
            expressRes.end();
        } catch (e) {
            console.error("OpenRouter Stream Error:", e);
            if (!expressRes.headersSent) {
                expressRes.status(500).json({ error: 'Failed to generate response' });
            } else {
                expressRes.end();
            }
        }
    }
}
