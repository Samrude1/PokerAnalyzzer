import fs from 'fs/promises';
import path from 'path';
import { HandNarrator } from './HandNarrator.js';
import { OpenRouterService } from './OpenRouterService.js';
import { HandAnalyzer } from './HandAnalyzer.js';

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
                
                let modeFilter = null;
                if (contextSessionId === 'global-cash') { modeFilter = 'cash'; targetSessionId = null; }
                if (contextSessionId === 'global-tournament') { modeFilter = 'tournament'; targetSessionId = null; }
                if (contextSessionId === 'global-all') { targetSessionId = null; }

                if (!targetSessionId && Object.keys(sessionIdToFile).length > 0) {
                    let newestSession = null;
                    let newestTime = 0;
                    for (const filePath of Object.values(sessionIdToFile)) {
                        const fileData = await this.readSessionFile(filePath);
                        if (fileData && fileData.session.userId === user.id) {
                            if (modeFilter && fileData.session.mode !== modeFilter) continue;
                            const time = new Date(fileData.session.date).getTime();
                            if (time > newestTime) {
                                newestTime = time;
                                newestSession = fileData;
                            }
                        }
                    }
                    if (newestSession) {
                        const profiles = HandAnalyzer.classifyPlayers(newestSession.hands || [], user.username);
                        const stats = `SESSION SUMMARY\nMode: ${newestSession.session.mode}\nDifficulty: ${newestSession.session.difficulty}\nHands Played: ${newestSession.session.handsPlayed}\nNet Chips Won: ${newestSession.session.chipsWon}\n`;
                        const handsStr = (newestSession.hands || []).map(h => HandNarrator.narrateHand(h, user.username, profiles)).join('\n\n');
                        contextText = stats + '\n\n' + handsStr;
                    }
                } else if (targetSessionId && !targetSessionId.startsWith('global-')) {
                    const filePath = sessionIdToFile[targetSessionId];
                    if (filePath) {
                        const fileData = await this.readSessionFile(filePath);
                        if (fileData && fileData.session.userId === user.id) {
                            const profiles = HandAnalyzer.classifyPlayers(fileData.hands || [], user.username);
                            const stats = `SESSION SUMMARY\nMode: ${fileData.session.mode}\nDifficulty: ${fileData.session.difficulty}\nHands Played: ${fileData.session.handsPlayed}\nNet Chips Won: ${fileData.session.chipsWon}\n`;
                            const handsStr = (fileData.hands || []).map(h => HandNarrator.narrateHand(h, user.username, profiles)).join('\n\n');
                            contextText = stats + '\n\n' + handsStr;
                        }
                    }
                }
            } else if (actionType === 'leakfinder') {
                const allHands = [];
                let totalHandsPlayed = 0;
                let totalChipsWon = 0;
                let vpipCount = 0;
                let pfrCount = 0;
                
                let modeFilter = null;
                if (contextSessionId === 'global-cash') modeFilter = 'cash';
                if (contextSessionId === 'global-tournament') modeFilter = 'tournament';

                for (const filePath of Object.values(sessionIdToFile)) {
                    const fileData = await this.readSessionFile(filePath);
                    if (fileData && fileData.session.userId === user.id) {
                        if (modeFilter && fileData.session.mode !== modeFilter) continue;

                        totalHandsPlayed += fileData.session.handsPlayed || 0;
                        totalChipsWon += fileData.session.chipsWon || 0;
                        if (fileData.hands) {
                            allHands.push(...fileData.hands);
                        }
                    }
                }
                
                for (const h of allHands) {
                    const isVpip = h.actionLog.some(log => (log.startsWith(`${user.username} calls`) || log.startsWith(`${user.username} raises`)) && !log.includes('--- FLOP ---'));
                    const isPfr = h.actionLog.some(log => log.startsWith(`${user.username} raises`) && !log.includes('--- FLOP ---'));
                    if (isVpip) vpipCount++;
                    if (isPfr) pfrCount++;
                }
                
                const vpipPercent = totalHandsPlayed > 0 ? ((vpipCount / totalHandsPlayed) * 100).toFixed(1) : 0;
                const pfrPercent = totalHandsPlayed > 0 ? ((pfrCount / totalHandsPlayed) * 100).toFixed(1) : 0;
                
                const stats = `GLOBAL STATS (${modeFilter ? modeFilter.toUpperCase() : 'ALL TIME'})\nTotal Hands: ${totalHandsPlayed}\nTotal Chips Won: ${totalChipsWon}\nVPIP: ${vpipPercent}%\nPFR: ${pfrPercent}%\n`;

                allHands.sort((a, b) => Math.abs(b.heroNetWon || 0) - Math.abs(a.heroNetWon || 0));
                
                const profiles = HandAnalyzer.classifyPlayers(allHands, user.username);
                const topHands = allHands.slice(0, 40);
                const handsStr = topHands.map(h => HandNarrator.narrateHand(h, user.username, profiles)).join('\n\n');
                    
                contextText = stats + '\n\nMOST IMPACTFUL HANDS:\n' + handsStr;
            } else {
                // Standard Chat
                if (contextSessionId && !contextSessionId.startsWith('global-')) {
                    const filePath = sessionIdToFile[contextSessionId];
                    if (filePath) {
                        const fileData = await this.readSessionFile(filePath);
                        if (fileData && fileData.session.userId === user.id) {
                            const keywords = question.toLowerCase().split(' ').filter(w => w.length > 2);
                            const relevantHands = (fileData.hands || []).filter(h => {
                                const handStr = JSON.stringify(h).toLowerCase();
                                return keywords.some(k => handStr.includes(k));
                            }).slice(0, 10);
                            
                            if (relevantHands.length > 0) {
                                const profiles = HandAnalyzer.classifyPlayers(fileData.hands || [], user.username);
                                contextText = relevantHands.map(h => HandNarrator.narrateHand(h, user.username, profiles)).join('\n\n');
                            }
                        }
                    }
                }
            }

            // Build Prompt
            let systemPrompt = "You are an elite, professional AI Poker Coach specializing in modern GTO and exploitative tight-aggressive (TAG) strategies. You provide extremely high-level, mathematically sound, and strategically ruthless advice. Do NOT give beginner-level generic advice. Call out mistakes bluntly. Use the PRE-COMPUTED FACTS provided in the hand histories. NEVER contradict the pre-computed facts. If the facts say it's an iso-raise, do NOT call it a 3-bet. If the facts say Hero has Ace-high, do NOT call it Top Pair.";
            
            // Adjust prompt based on mode
            if (contextText.includes('Mode: tournament') || contextText.includes('STATS (TOURNAMENT)')) {
                systemPrompt += " CRITICAL RULE: You are analyzing TOURNAMENT hands. You MUST evaluate plays based on tournament logic (Push/Fold charts, Stack-to-Blind Ratios, ICM). Shoving wide or calling all-ins with marginal hands when short-stacked is often correct in tournaments. DO NOT criticize short-stack shoves using deep-stack cash game logic!";
            } else if (contextText.includes('Mode: cash') || contextText.includes('STATS (CASH)')) {
                systemPrompt += " You are analyzing CASH GAME hands. Focus on deep-stack play, pure Chip EV, and optimal bet sizings.";
            }

            if (actionType === 'leakfinder') {
                systemPrompt += " You are an elite AI Poker Coach performing a Global Leak Finder analysis. Review the provided global stats and most impactful hands. Identify the biggest strategic leaks in the player's game (e.g., VPIP too high, calling 3-bets out of position, overplaying weak top pairs). Be specific, reference the hands to back up your claims, and offer actionable, GTO-approved advice.\n\nCRITICAL INSTRUCTION: Provide a clear, structured analysis. Do not include internal thought processes.";
            } else if (actionType === 'session_review') {
                systemPrompt += " You are an elite AI Poker Coach performing a Session Review. Review the provided session context and ALL provided hands. Summarize the session, point out the best plays, and brutally identify areas for improvement. Point out bad calls, poor sizings, and positional awareness mistakes. Use modern poker terminology (c-bet, blockers, pot odds, equity).\n\nCRITICAL INSTRUCTION: Provide a clear, structured review. Do not include internal thought processes.";
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
