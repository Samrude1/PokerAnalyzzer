import fs from 'fs/promises';
import path from 'path';
import { HandNarrator } from './HandNarrator.js';
import { OpenRouterService } from './OpenRouterService.js';

export class AIAnalyzer {
    constructor(dbDir) {
        this.dbDir = dbDir;
    }

    async analyze(user, question, expressRes, actionType, contextSessionId, sessionIdToFile) {
        try {
            let contextText = '';
            
            if (actionType === 'session_review') {
                // Session Review: Provide ALL hands from the specific session, or the newest one if none provided
                let targetSessionId = contextSessionId;
                
                // If no specific session is selected, find the most recent one from sessionIdToFile
                if (!targetSessionId && Object.keys(sessionIdToFile).length > 0) {
                    // Get the newest session (assuming keys or file dates are sortable, but let's just read them or rely on sorting)
                    // The easiest way is to find the session file with the highest timestamp in the filename sess_178...
                    const sortedKeys = Object.keys(sessionIdToFile).sort();
                    targetSessionId = sortedKeys[sortedKeys.length - 1];
                }

                const filePath = sessionIdToFile[targetSessionId];
                if (filePath) {
                    const fileData = await this.readSessionFile(filePath);
                    if (fileData) {
                        const stats = `SESSION SUMMARY
Mode: ${fileData.session.mode}
Difficulty: ${fileData.session.difficulty}
Hands Played: ${fileData.session.handsPlayed}
Net Chips Won: ${fileData.session.chipsWon}
`;
                        const handsStr = (fileData.hands || [])
                            .map(h => HandNarrator.narrateHand(h, user.username))
                            .join('\n\n');
                            
                        contextText = stats + '\n\n' + handsStr;
                    }
                }
            } else if (actionType === 'leakfinder') {
                // Global Leak Finder: Provide global stats + 40 most impactful hands across all sessions
                const allHands = [];
                let totalHandsPlayed = 0;
                let totalChipsWon = 0;
                let vpipCount = 0;
                let pfrCount = 0;
                
                // Read all sessions from sessionIdToFile
                for (const [sessionId, filePath] of Object.entries(sessionIdToFile)) {
                    const fileData = await this.readSessionFile(filePath);
                    if (fileData) {
                        totalHandsPlayed += fileData.session.handsPlayed || 0;
                        totalChipsWon += fileData.session.chipsWon || 0;
                        if (fileData.hands) {
                            allHands.push(...fileData.hands);
                        }
                    }
                }
                
                // Calculate simple stats
                for (const h of allHands) {
                    const isVpip = h.actionLog.some(log => 
                        (log.startsWith(`${user.username} calls`) || log.startsWith(`${user.username} raises`)) &&
                        !log.includes('--- FLOP ---') // Only preflop counts for pure VPIP
                    );
                    const isPfr = h.actionLog.some(log => 
                        log.startsWith(`${user.username} raises`) &&
                        !log.includes('--- FLOP ---')
                    );
                    
                    if (isVpip) vpipCount++;
                    if (isPfr) pfrCount++;
                }
                
                const vpipPercent = totalHandsPlayed > 0 ? ((vpipCount / totalHandsPlayed) * 100).toFixed(1) : 0;
                const pfrPercent = totalHandsPlayed > 0 ? ((pfrCount / totalHandsPlayed) * 100).toFixed(1) : 0;
                
                const stats = `GLOBAL STATS (All Time)
Total Hands: ${totalHandsPlayed}
Total Chips Won: ${totalChipsWon}
VPIP: ${vpipPercent}%
PFR: ${pfrPercent}%
`;

                // Sort hands by absolute net won (biggest pots won/lost)
                allHands.sort((a, b) => Math.abs(b.heroNetWon || 0) - Math.abs(a.heroNetWon || 0));
                
                // Take top 40 most impactful hands
                const topHands = allHands.slice(0, 40);
                const handsStr = topHands
                    .map(h => HandNarrator.narrateHand(h, user.username))
                    .join('\n\n');
                    
                contextText = stats + '\n\nMOST IMPACTFUL HANDS:\n' + handsStr;
            } else {
                // Standard Chat
                if (contextSessionId) {
                    const filePath = sessionIdToFile[contextSessionId];
                    if (filePath) {
                        const fileData = await this.readSessionFile(filePath);
                        if (fileData) {
                            // Filter hands by keywords in the question (simple keyword match instead of vector search)
                            const keywords = question.toLowerCase().split(' ').filter(w => w.length > 2);
                            const relevantHands = (fileData.hands || []).filter(h => {
                                const handStr = JSON.stringify(h).toLowerCase();
                                return keywords.some(k => handStr.includes(k));
                            }).slice(0, 10); // Max 10 relevant hands
                            
                            if (relevantHands.length > 0) {
                                contextText = relevantHands
                                    .map(h => HandNarrator.narrateHand(h, user.username))
                                    .join('\n\n');
                            }
                        }
                    }
                }
            }

            // Build Prompt
            let systemPrompt = "You are an elite, professional AI Poker Coach specializing in modern GTO and exploitative tight-aggressive (TAG) strategies. You provide extremely high-level, mathematically sound, and strategically ruthless advice. Do NOT give beginner-level generic advice. Call out mistakes bluntly, especially calling raises with weak offsuit hands out of position. Your analysis must be top tier.";
            
            if (actionType === 'leakfinder') {
                systemPrompt = "You are an elite AI Poker Coach performing a Global Leak Finder analysis. Review the provided global stats and most impactful hands. Identify the biggest strategic leaks in the player's game (e.g., VPIP too high, calling 3-bets out of position, overplaying weak top pairs). Be specific, reference the hands to back up your claims, and offer actionable, GTO-approved advice.\n\nCRITICAL INSTRUCTION: Provide a clear, structured analysis. Do not include internal thought processes.";
            } else if (actionType === 'session_review') {
                systemPrompt = "You are an elite AI Poker Coach performing a Session Review. Review the provided session context and ALL provided hands. Summarize the session, point out the best plays, and brutally identify areas for improvement. Point out bad calls, poor sizings, and positional awareness mistakes. Use modern poker terminology (c-bet, blockers, pot odds, equity).\n\nCRITICAL INSTRUCTION: Provide a clear, structured review. Do not include internal thought processes.";
            } else {
                systemPrompt += " If the user asks a general question, answer it. If they provide context hands, use them to ground your answer in their actual play.";
            }
            
            const prompt = contextText.length > 0 
                ? `Context:\n${contextText}\n\nQuestion: ${question}`
                : `Question: ${question}`;

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ];
            
            // Stream response
            await OpenRouterService.chatStream(messages, expressRes);
        } catch (e) {
            console.error("AIAnalyzer Error:", e);
            if (!expressRes.headersSent) {
                expressRes.status(500).json({ error: 'Failed to generate response' });
            } else {
                expressRes.end();
            }
        }
    }

    async readSessionFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }
}
