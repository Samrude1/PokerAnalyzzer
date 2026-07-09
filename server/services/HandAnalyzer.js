export class HandAnalyzer {
    static classifyPlayers(hands, username) {
        const stats = {};
        const safeUsername = username.toLowerCase();

        const initPlayer = (name) => {
            if (!stats[name]) stats[name] = { hands: 0, vpip: 0, pfr: 0, aggr: 0, calls: 0 };
        };

        hands.forEach(hand => {
            if (!hand.actionLog) return;
            
            const playersInHand = new Set();
            const putMoneyInPot = new Set();
            const raisedPre = new Set();
            const handAggr = {};
            const handCalls = {};
            
            let phase = 'preflop';

            hand.actionLog.forEach(log => {
                if (log.startsWith('--- FLOP ---')) { phase = 'flop'; return; }
                if (log.startsWith('--- TURN ---')) { phase = 'turn'; return; }
                if (log.startsWith('--- RIVER ---')) { phase = 'river'; return; }

                const match = log.match(/^(.+?)\s+(folds|calls|checks|raises|bets)/i);
                if (match) {
                    let player = match[1].trim();
                    if (player.toLowerCase() === safeUsername) player = "Hero";
                    
                    playersInHand.add(player);
                    const act = match[2].toLowerCase();

                    if (phase === 'preflop') {
                        if (act === 'calls' || act === 'raises') putMoneyInPot.add(player);
                        if (act === 'raises') raisedPre.add(player);
                    } else {
                        if (act === 'bets' || act === 'raises') {
                            handAggr[player] = (handAggr[player] || 0) + 1;
                        } else if (act === 'calls') {
                            handCalls[player] = (handCalls[player] || 0) + 1;
                        }
                    }
                }
            });

            playersInHand.forEach(p => {
                initPlayer(p);
                stats[p].hands++;
                if (putMoneyInPot.has(p)) stats[p].vpip++;
                if (raisedPre.has(p)) stats[p].pfr++;
                stats[p].aggr += (handAggr[p] || 0);
                stats[p].calls += (handCalls[p] || 0);
            });
        });

        const profiles = {};
        for (const [p, s] of Object.entries(stats)) {
            const vpip = s.hands > 0 ? Math.round((s.vpip / s.hands) * 100) : 0;
            const pfr = s.hands > 0 ? Math.round((s.pfr / s.hands) * 100) : 0;
            const af = s.calls > 0 ? (s.aggr / s.calls).toFixed(1) : (s.aggr > 0 ? 'Inf' : '0.0');

            let tag = 'Unknown';
            if (s.hands >= 10) {
                if (vpip < 18 && pfr < 14) tag = 'Nit';
                else if (vpip > 30 && pfr < 15) tag = 'Fish / Calling Station';
                else if (vpip >= 18 && vpip <= 28 && pfr >= 15) tag = 'TAG (Tight Aggressive)';
                else if (vpip > 28 && pfr > 20) tag = 'LAG (Loose Aggressive)';
                else tag = 'Loose Passive';
            }

            profiles[p] = { tag, vpip, pfr, af, hands: s.hands };
        }
        return profiles;
    }

    static evaluateHandStrength(heroCards, boardCards) {
        if (!heroCards || heroCards.length < 2) return "Unknown";
        if (!boardCards || boardCards.length === 0) return "Starting Hand";
        
        const rankValues = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'A':14 };
        const rankNames = { 2:'Two', 3:'Three', 4:'Four', 5:'Five', 6:'Six', 7:'Seven', 8:'Eight', 9:'Nine', 10:'Ten', 11:'Jack', 12:'Queen', 13:'King', 14:'Ace' };
        
        const allCards = [...heroCards, ...boardCards].map(c => ({
            rankStr: c[0], suit: c[1], val: rankValues[c[0]]
        }));

        const boardOnly = boardCards.map(c => ({
            rankStr: c[0], suit: c[1], val: rankValues[c[0]]
        }));

        const suitCounts = {};
        allCards.forEach(c => { suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1; });
        const flushSuit = Object.keys(suitCounts).find(s => suitCounts[s] >= 5);

        const uniqueVals = [...new Set(allCards.map(c => c.val))].sort((a,b)=>b-a);
        if (uniqueVals.includes(14)) uniqueVals.push(1);
        let straightHigh = 0;
        for (let i = 0; i <= uniqueVals.length - 5; i++) {
            if (uniqueVals[i] - uniqueVals[i+4] === 4) {
                straightHigh = uniqueVals[i];
                break;
            }
        }

        const rankCounts = {};
        allCards.forEach(c => { rankCounts[c.val] = (rankCounts[c.val] || 0) + 1; });
        
        const boardRankCounts = {};
        boardOnly.forEach(c => { boardRankCounts[c.val] = (boardRankCounts[c.val] || 0) + 1; });

        let quads = 0, trips = 0, pairs = [];
        for (const [vStr, count] of Object.entries(rankCounts)) {
            const v = parseInt(vStr);
            if (count === 4) quads = v;
            else if (count === 3) trips = v;
            else if (count === 2) pairs.push(v);
        }
        pairs.sort((a,b)=>b-a);

        if (straightHigh && flushSuit) return `Straight Flush (${rankNames[straightHigh]} high)`;
        if (quads) return `Four of a Kind (${rankNames[quads]}s)`;
        if (trips && pairs.length > 0) return `Full House (${rankNames[trips]}s full of ${rankNames[pairs[0]]}s)`;
        if (flushSuit) return `Flush (${flushSuit} high)`;
        if (straightHigh) return `Straight (${rankNames[straightHigh]} high)`;
        
        if (trips) {
            const heroVals = heroCards.map(c => rankValues[c[0]]);
            if (heroVals[0] === heroVals[1] && heroVals[0] === trips) return `Set of ${rankNames[trips]}s`;
            if (boardRankCounts[trips] === 3) return `Board plays Three of a Kind (${rankNames[trips]}s)`;
            return `Three of a Kind (${rankNames[trips]}s)`;
        }
        
        if (pairs.length >= 2) {
            const isBoardPaired1 = boardRankCounts[pairs[0]] === 2;
            const isBoardPaired2 = boardRankCounts[pairs[1]] === 2;
            if (isBoardPaired1 && isBoardPaired2) return `Board is Two Pair (${rankNames[pairs[0]]}s and ${rankNames[pairs[1]]}s)`;
            return `Two Pair (${rankNames[pairs[0]]}s and ${rankNames[pairs[1]]}s)`;
        }
        
        if (pairs.length === 1) {
            const p = pairs[0];
            if (boardRankCounts[p] === 2) {
                const heroVals = heroCards.map(c => rankValues[c[0]]).sort((a,b)=>b-a);
                return `Board is Paired (${rankNames[p]}s), Hero plays Ace-high or Kicker ${rankNames[heroVals[0]]} (No pair of own)`;
            }
            const boardMax = Math.max(...boardOnly.map(c => c.val));
            if (p > boardMax) return `Overpair (${rankNames[p]}s)`;
            if (p === boardMax) return `Top Pair (${rankNames[p]}s)`;
            
            const higherCards = boardOnly.filter(c => c.val > p).length;
            if (higherCards === 1) return `Second Pair (${rankNames[p]}s)`;
            return `Bottom/Weak Pair (${rankNames[p]}s)`;
        }

        const maxVal = Math.max(...allCards.map(c => c.val));
        return `High Card (${rankNames[maxVal]} high, NO PAIR)`;
    }

    static analyzeBoardTexture(boardCards) {
        if (!boardCards || boardCards.length === 0) return "";
        const rankValues = { '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'T':10, 'J':11, 'Q':12, 'K':13, 'A':14 };
        const suits = {};
        const vals = [];
        boardCards.forEach(c => {
            suits[c[1]] = (suits[c[1]] || 0) + 1;
            vals.push(rankValues[c[0]]);
        });
        
        let flushDraw = false;
        let monotone = false;
        const maxSuits = Math.max(...Object.values(suits));
        if (maxSuits === 3) flushDraw = true;
        if (maxSuits >= 4) monotone = true;

        let paired = false;
        const vCounts = {};
        vals.forEach(v => { vCounts[v] = (vCounts[v] || 0) + 1; });
        if (Object.values(vCounts).some(c => c > 1)) paired = true;

        const maxVal = Math.max(...vals);
        let highCard = 'Low';
        if (maxVal >= 10) highCard = 'Broadway';
        if (maxVal === 14) highCard = 'Ace-high';

        const tags = [];
        if (paired) tags.push("Paired");
        if (monotone) tags.push("Monotone/Flush Possible");
        else if (flushDraw) tags.push("Flush Draw Possible");
        else tags.push("Rainbow/Dry");

        tags.push(`${highCard} Board`);
        
        return tags.join(", ");
    }

    static analyzePreflopAction(hand, username) {
        if (!hand.actionLog) return "Unknown";
        const safeUsername = username.toLowerCase();
        
        let limpers = 0;
        let raisers = 0;
        let heroAction = "Unknown";
        
        for (const log of hand.actionLog) {
            if (log.startsWith('--- FLOP ---')) break;
            
            const match = log.match(/^(.+?)\s+(folds|calls|checks|raises|bets)/i);
            if (match) {
                const player = match[1].trim().toLowerCase();
                const act = match[2].toLowerCase();
                
                if (player === safeUsername) {
                    if (act === 'raises') {
                        if (raisers === 0 && limpers === 0) heroAction = "OPEN-RAISED (First in)";
                        else if (raisers === 0 && limpers > 0) heroAction = `ISO-RAISED over ${limpers} limper(s). This is NOT a 3-bet.`;
                        else if (raisers === 1) heroAction = `3-BET over 1 raiser.`;
                        else if (raisers > 1) heroAction = `4-BET+ over multiple raises.`;
                    } else if (act === 'calls') {
                        if (raisers === 0) heroAction = "LIMPED";
                        else if (raisers === 1) heroAction = "FLAT CALLED a raise";
                        else heroAction = "CALLED a 3-bet+";
                    } else if (act === 'folds') {
                        heroAction = "FOLDED preflop";
                    }
                    break;
                } else {
                    if (act === 'calls') limpers++;
                    if (act === 'raises') {
                        raisers++;
                        limpers = 0;
                    }
                }
            }
        }
        return heroAction;
    }

    static analyzeHand(hand, username, profiles) {
        const safeUsername = username.toLowerCase();
        let preflop = this.analyzePreflopAction(hand, username);
        let board = this.analyzeBoardTexture(hand.boardCards);
        let handStr = this.evaluateHandStrength(hand.heroCards, hand.boardCards);

        let opponentsStr = [];
        const involved = new Set();
        let phase = 'preflop';
        if (hand.actionLog) {
            hand.actionLog.forEach(log => {
                if (log.startsWith('--- FLOP ---')) phase = 'flop';
                if (phase === 'preflop') return;
                
                const match = log.match(/^(.+?)\s+(folds|calls|checks|raises|bets)/i);
                if (match) {
                    const p = match[1].trim();
                    if (p.toLowerCase() !== safeUsername && p.toLowerCase() !== 'hero') involved.add(p);
                }
            });
        }

        if (involved.size === 0) {
            if (hand.actionLog) {
                hand.actionLog.forEach(log => {
                    const match = log.match(/^(.+?)\s+(calls|raises)/i);
                    if (match) {
                        const p = match[1].trim();
                        if (p.toLowerCase() !== safeUsername && p.toLowerCase() !== 'hero') involved.add(p);
                    }
                });
            }
        }

        involved.forEach(p => {
            const prof = profiles[p];
            if (prof) {
                opponentsStr.push(`  - ${p}: ${prof.tag} (VPIP: ${prof.vpip}%, PFR: ${prof.pfr}%, AF: ${prof.af})`);
            }
        });

        let output = `=== PRE-COMPUTED FACTS (Do NOT hallucinate or contradict this) ===\n`;
        output += `Preflop Action: Hero ${preflop}\n`;
        output += `Hero's Final Hand Strength: ${handStr}\n`;
        if (hand.boardCards && hand.boardCards.length > 0) {
            output += `Board Texture: ${board}\n`;
        }
        if (opponentsStr.length > 0) {
            output += `Opponent Profiles (for involved players):\n${opponentsStr.join('\n')}\n`;
        } else {
            output += `Opponent Profiles: No significant opponents.\n`;
        }
        output += `==================================================================\n`;
        
        return output;
    }
}
