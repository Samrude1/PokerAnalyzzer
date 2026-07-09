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
                let statsAcc = {
                    totalHandsPlayed: 0,
                    totalChipsWon: 0,
                    vpipCount: 0,
                    pfrCount: 0,
                    threeBetCount: 0,
                    threeBetOpportunity: 0,
                    cbetFlopOpp: 0,
                    cbetFlopCount: 0,
                    aggressionsCount: 0,
                    callsCount: 0,
                    sawFlopCount: 0,
                    showdownsReached: 0,
                    showdownsWon: 0,
                    stealOpp: 0,
                    stealCount: 0,
                    foldToStealOpp: 0,
                    foldToStealCount: 0,
                    foldToThreeBetOpp: 0,
                    foldToThreeBetCount: 0,
                    foldToCbetOpp: 0,
                    foldToCbetCount: 0,
                    wonWhenSawFlopCount: 0,
                    cbetTurnOpp: 0,
                    cbetTurnCount: 0,
                    cbetRiverOpp: 0,
                    cbetRiverCount: 0
                };
                
                let modeFilter = null;
                if (contextSessionId === 'global-cash') modeFilter = 'cash';
                if (contextSessionId === 'global-tournament') modeFilter = 'tournament';

                for (const filePath of Object.values(sessionIdToFile)) {
                    const fileData = await this.readSessionFile(filePath);
                    if (fileData && fileData.session.userId === user.id) {
                        if (modeFilter && fileData.session.mode !== modeFilter) continue;

                        const s = fileData.session;
                        statsAcc.totalHandsPlayed += s.handsPlayed || 0;
                        statsAcc.totalChipsWon += s.chipsWon || 0;
                        statsAcc.vpipCount += s.vpipCount || 0;
                        statsAcc.pfrCount += s.pfrCount || 0;
                        statsAcc.threeBetCount += s.threeBetCount || 0;
                        statsAcc.threeBetOpportunity += s.threeBetOpportunity || 0;
                        statsAcc.cbetFlopOpp += s.cbetFlopOpp || 0;
                        statsAcc.cbetFlopCount += s.cbetFlopCount || 0;
                        statsAcc.aggressionsCount += s.aggressionsCount || 0;
                        statsAcc.callsCount += s.callsCount || 0;
                        statsAcc.sawFlopCount += s.sawFlopCount || 0;
                        statsAcc.showdownsReached += s.showdownsReached || 0;
                        statsAcc.showdownsWon += s.showdownsWon || 0;
                        statsAcc.stealOpp += s.stealOpp || 0;
                        statsAcc.stealCount += s.stealCount || 0;
                        statsAcc.foldToStealOpp += s.foldToStealOpp || 0;
                        statsAcc.foldToStealCount += s.foldToStealCount || 0;
                        statsAcc.foldToThreeBetOpp += s.foldToThreeBetOpp || 0;
                        statsAcc.foldToThreeBetCount += s.foldToThreeBetCount || 0;
                        statsAcc.foldToCbetOpp += s.foldToCbetOpp || 0;
                        statsAcc.foldToCbetCount += s.foldToCbetCount || 0;
                        statsAcc.wonWhenSawFlopCount += s.wonWhenSawFlopCount || 0;
                        statsAcc.cbetTurnOpp += s.cbetTurnOpp || 0;
                        statsAcc.cbetTurnCount += s.cbetTurnCount || 0;
                        statsAcc.cbetRiverOpp += s.cbetRiverOpp || 0;
                        statsAcc.cbetRiverCount += s.cbetRiverCount || 0;
                    }
                }
                
                const pct = (num, den) => den > 0 ? ((num / den) * 100).toFixed(1) : 0;
                
                const vpipPercent = pct(statsAcc.vpipCount, statsAcc.totalHandsPlayed);
                const pfrPercent = pct(statsAcc.pfrCount, statsAcc.totalHandsPlayed);
                const threeBetPercent = pct(statsAcc.threeBetCount, statsAcc.threeBetOpportunity);
                const cbetPercent = pct(statsAcc.cbetFlopCount, statsAcc.cbetFlopOpp);
                const turnCbetPercent = pct(statsAcc.cbetTurnCount, statsAcc.cbetTurnOpp);
                const riverCbetPercent = pct(statsAcc.cbetRiverCount, statsAcc.cbetRiverOpp);
                const wtsdPercent = pct(statsAcc.showdownsReached, statsAcc.sawFlopCount);
                const wsdPercent = pct(statsAcc.showdownsWon, statsAcc.showdownsReached);
                const wwsfPercent = pct(statsAcc.wonWhenSawFlopCount, statsAcc.sawFlopCount);
                const stealPercent = pct(statsAcc.stealCount, statsAcc.stealOpp);
                const foldToStealPercent = pct(statsAcc.foldToStealCount, statsAcc.foldToStealOpp);
                const foldToThreeBetPercent = pct(statsAcc.foldToThreeBetCount, statsAcc.foldToThreeBetOpp);
                const foldToCbetPercent = pct(statsAcc.foldToCbetCount, statsAcc.foldToCbetOpp);
                const af = statsAcc.callsCount > 0 ? (statsAcc.aggressionsCount / statsAcc.callsCount).toFixed(2) : statsAcc.aggressionsCount;
                
                contextText = `GLOBAL STATS (${modeFilter ? modeFilter.toUpperCase() : 'ALL TIME'})
Total Hands: ${statsAcc.totalHandsPlayed}
Net Result: ${statsAcc.totalChipsWon} chips
VPIP: ${vpipPercent}%
PFR: ${pfrPercent}%
3-Bet: ${threeBetPercent}%
Flop C-Bet: ${cbetPercent}%
Turn C-Bet: ${turnCbetPercent}%
River C-Bet: ${riverCbetPercent}%
Attempt to Steal: ${stealPercent}%
Fold to Steal: ${foldToStealPercent}%
Fold to 3-Bet: ${foldToThreeBetPercent}%
Fold to Flop C-Bet: ${foldToCbetPercent}%
Aggression Factor (AF): ${af}
Went to Showdown (WTSD): ${wtsdPercent}%
Won $ at Showdown (W$SD): ${wsdPercent}%
Won $ When Saw Flop (W$WSF): ${wwsfPercent}%
`;
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
                systemPrompt += " You are an elite AI Poker Coach performing a Global Leak Finder analysis based purely on the player's cumulative database statistics. Review the provided global stats. Identify the biggest strategic leaks in the player's game based on their VPIP/PFR gap, 3-bet frequency, aggression factor (AF), C-bet frequencies (flop/turn/river), response to aggression (Fold to 3-Bet, Fold to C-Bet, Fold to Steal), and showdown metrics (WTSD, W$SD, W$WSF). Be extremely analytical, explain what their specific statistical profile indicates about their playstyle, and offer actionable, GTO-approved advice to fix the leaks identified in the numbers.\n\nCRITICAL INSTRUCTION: Provide a clear, structured analysis focusing on the numbers. Do not ask for individual hand histories.";
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
