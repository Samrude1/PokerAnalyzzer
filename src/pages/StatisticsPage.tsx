import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService, SavedSession, SavedHand } from '../services/StorageService';
import { Card } from '../components/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';

const parseCardString = (cardStr: string) => {
    if (!cardStr) return null;
    let rank = cardStr.slice(0, -1);
    if (rank === 'T') rank = '10'; // Card component handles 'T' internally though, wait!
    // Wait, Card.tsx uses `rankNames[card.rank]`, where it expects 'T' to map to '10'.
    // If cardStr is "Th", we should pass rank: 'T', suit: 'h'.
    // Let's just use it directly!
    return { rank: cardStr.slice(0, -1), suit: cardStr.slice(-1) } as any;
};

export const StatisticsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SavedSession[]>([]);
    const [mode, setMode] = useState<'cash' | 'tournament'>('cash');
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [hands, setHands] = useState<SavedHand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedHand, setSelectedHand] = useState<SavedHand | null>(null);
    const [filterMinPot, setFilterMinPot] = useState<number>(0);
    const [filterOutcome, setFilterOutcome] = useState<'all' | 'won' | 'lost'>('all');
    const [filterCards, setFilterCards] = useState<string>('');

    useEffect(() => {
        if (user) {
            StorageService.getSessions(user.id).then(data => {
                setSessions(data.reverse()); // Newest first
                setIsLoading(false);
            });
        }
    }, [user]);

    useEffect(() => {
        if (selectedSessionId) {
            StorageService.getHands(selectedSessionId).then(setHands);
        } else {
            setHands([]);
        }
    }, [selectedSessionId]);

    const filteredSessions = sessions.filter(s => s.mode === mode || (!s.mode && mode === 'cash'));

    // Auto-select is removed so users can see the Leakfinder by default
    useEffect(() => {
        if (filteredSessions.length === 0) {
            setSelectedSessionId(null);
        }
    }, [mode, filteredSessions]);

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this session?')) {
            await StorageService.deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (selectedSessionId === sessionId) {
                setSelectedSessionId(null);
            }
        }
    };

    const chartData = useMemo(() => {
        let cumulativeNet = 0;
        let cumulativeShowdown = 0;
        let cumulativeNonShowdown = 0;

        return hands.map(h => {
            cumulativeNet += h.heroNetWon || 0;
            cumulativeShowdown += h.heroShowdownWon || 0;
            cumulativeNonShowdown += h.heroNonShowdownWon || 0;

            return {
                name: `Hand ${h.handNumber}`,
                NetWon: cumulativeNet,
                Showdown: cumulativeShowdown,
                NonShowdown: cumulativeNonShowdown
            };
        });
    }, [hands]);

    const filteredHands = useMemo(() => {
        return hands.filter(h => {
            if (filterMinPot > 0 && h.potSize < filterMinPot) return false;
            if (filterOutcome === 'won' && h.heroNetWon <= 0) return false;
            if (filterOutcome === 'lost' && h.heroNetWon >= 0) return false;
            if (filterCards) {
                const searchStr = filterCards.toLowerCase();
                const hasCard = h.heroCards.some(c => c.toLowerCase().includes(searchStr));
                if (!hasCard) return false;
            }
            return true;
        });
    }, [hands, filterMinPot, filterOutcome, filterCards]);

    const lifetimeStats = useMemo(() => {
        let handsPlayed = 0;
        let vpipCount = 0;
        let pfrCount = 0;
        let threeBetCount = 0;
        let threeBetOpportunity = 0;
        let aggressionsCount = 0;
        let callsCount = 0;

        // Advanced Metrics
        let sawFlopCount = 0;
        let wonWhenSawFlopCount = 0;
        let showdownsReached = 0;
        let showdownsWon = 0;
        let cbetFlopOpp = 0, cbetFlopCount = 0;
        let cbetTurnOpp = 0, cbetTurnCount = 0;
        let cbetRiverOpp = 0, cbetRiverCount = 0;
        let stealOpp = 0, stealCount = 0;
        let foldToStealOpp = 0, foldToStealCount = 0;
        let foldToThreeBetOpp = 0, foldToThreeBetCount = 0;

        const positionalStats: Record<string, any> = {};

        filteredSessions.forEach(s => {
            handsPlayed += s.handsPlayed || 0;
            vpipCount += s.vpipCount || 0;
            pfrCount += s.pfrCount || 0;
            threeBetCount += s.threeBetCount || 0;
            threeBetOpportunity += s.threeBetOpportunity || 0;
            aggressionsCount += s.aggressionsCount || 0;
            callsCount += s.callsCount || 0;

            sawFlopCount += s.sawFlopCount || 0;
            wonWhenSawFlopCount += s.wonWhenSawFlopCount || 0;
            showdownsReached += s.showdownsReached || 0;
            showdownsWon += s.showdownsWon || 0;

            cbetFlopOpp += s.cbetFlopOpp || 0;
            cbetFlopCount += s.cbetFlopCount || 0;
            cbetTurnOpp += s.cbetTurnOpp || 0;
            cbetTurnCount += s.cbetTurnCount || 0;
            cbetRiverOpp += s.cbetRiverOpp || 0;
            cbetRiverCount += s.cbetRiverCount || 0;

            stealOpp += s.stealOpp || 0;
            stealCount += s.stealCount || 0;
            foldToStealOpp += s.foldToStealOpp || 0;
            foldToStealCount += s.foldToStealCount || 0;
            foldToThreeBetOpp += s.foldToThreeBetOpp || 0;
            foldToThreeBetCount += s.foldToThreeBetCount || 0;

            // Aggregate positional stats
            if (s.positionalStats) {
                Object.keys(s.positionalStats).forEach(pos => {
                    if (!positionalStats[pos]) {
                        positionalStats[pos] = {
                            handsPlayed: 0, vpipCount: 0, pfrCount: 0,
                            stealOpp: 0, stealCount: 0
                        };
                    }
                    const pS = s.positionalStats![pos];
                    positionalStats[pos].handsPlayed += pS.handsPlayed || 0;
                    positionalStats[pos].vpipCount += pS.vpipCount || 0;
                    positionalStats[pos].pfrCount += pS.pfrCount || 0;
                    positionalStats[pos].stealOpp += pS.stealOpp || 0;
                    positionalStats[pos].stealCount += pS.stealCount || 0;
                });
            }
        });

        const vpip = handsPlayed > 0 ? (vpipCount / handsPlayed) * 100 : 0;
        const pfr = handsPlayed > 0 ? (pfrCount / handsPlayed) * 100 : 0;
        const af = callsCount > 0 ? aggressionsCount / callsCount : (aggressionsCount > 0 ? Infinity : 0);
        const threeBet = threeBetOpportunity > 0 ? (threeBetCount / threeBetOpportunity) * 100 : 0;

        const wtsd = sawFlopCount > 0 ? (showdownsReached / sawFlopCount) * 100 : 0;
        const wsd = showdownsReached > 0 ? (showdownsWon / showdownsReached) * 100 : 0;
        const wwsf = sawFlopCount > 0 ? (wonWhenSawFlopCount / sawFlopCount) * 100 : 0;

        const cbetFlop = cbetFlopOpp > 0 ? (cbetFlopCount / cbetFlopOpp) * 100 : 0;
        const cbetTurn = cbetTurnOpp > 0 ? (cbetTurnCount / cbetTurnOpp) * 100 : 0;
        const cbetRiver = cbetRiverOpp > 0 ? (cbetRiverCount / cbetRiverOpp) * 100 : 0;

        const ats = stealOpp > 0 ? (stealCount / stealOpp) * 100 : 0;
        const foldToSteal = foldToStealOpp > 0 ? (foldToStealCount / foldToStealOpp) * 100 : 0;
        const foldToThreeBet = foldToThreeBetOpp > 0 ? (foldToThreeBetCount / foldToThreeBetOpp) * 100 : 0;

        return {
            handsPlayed,
            vpip: vpip.toFixed(1),
            pfr: pfr.toFixed(1),
            af: af === Infinity ? '∞' : af.toFixed(1),
            threeBet: threeBet.toFixed(1),
            wtsd: wtsd.toFixed(1),
            wsd: wsd.toFixed(1),
            wwsf: wwsf.toFixed(1),
            cbetFlop: cbetFlop.toFixed(1),
            cbetTurn: cbetTurn.toFixed(1),
            cbetRiver: cbetRiver.toFixed(1),
            ats: ats.toFixed(1),
            foldToSteal: foldToSteal.toFixed(1),
            foldToThreeBet: foldToThreeBet.toFixed(1),
            positionalStats
        };
    }, [filteredSessions]);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <div className="p-4 bg-gray-800 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold transition">
                        ⬅ Back to Lobby
                    </button>
                    <h1 className="text-xl font-bold text-poker-gold">Statistics & Analysis</h1>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setMode('cash')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${mode === 'cash' ? 'bg-poker-gold text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        Cash Games
                    </button>
                    <button 
                        onClick={() => setMode('tournament')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${mode === 'tournament' ? 'bg-poker-gold text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        Tournaments
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-1/4 bg-gray-800/50 border-r border-gray-700 p-4 overflow-y-auto">
                    <h2 className="text-lg font-bold mb-4 text-gray-300">Sessions</h2>
                    
                    <div 
                        onClick={() => setSelectedSessionId(null)}
                        className={`p-3 rounded-lg text-left transition border cursor-pointer mb-4 flex items-center justify-between ${selectedSessionId === null ? 'bg-gray-700 border-poker-gold' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                    >
                        <div className="font-bold text-poker-gold">🌍 Global Leakfinder</div>
                    </div>

                    {isLoading ? (
                        <div className="animate-pulse text-gray-500">Loading...</div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-gray-500">No sessions found.</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filteredSessions.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedSessionId(s.id)}
                                    className={`relative p-3 rounded-lg text-left transition border cursor-pointer group ${selectedSessionId === s.id ? 'bg-gray-700 border-poker-gold' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="text-sm font-bold text-gray-200">{new Date(s.date).toLocaleString()}</div>
                                        <button 
                                            onClick={(e) => handleDeleteSession(e, s.id)}
                                            className="text-gray-500 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete Session"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">Difficulty: {s.difficulty}</div>
                                    <div className={`text-sm font-bold mt-2 ${s.chipsWon >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {s.chipsWon > 0 ? '+' : ''}{s.chipsWon} {mode === 'cash' ? 'Chips' : 'Net'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
                    {/* Main Content Dashboard */}

                    {!selectedSessionId ? (
                        <div className="flex-1 flex flex-col gap-6">
                            <h2 className="text-2xl font-bold text-poker-gold">Overall Lifetime Stats ({mode === 'cash' ? 'Cash Games' : 'Tournaments'})</h2>
                            
                            {/* Primary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                                    <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Hands Played</div>
                                    <div className="text-3xl font-bold text-white">{lifetimeStats.handsPlayed.toLocaleString()}</div>
                                </div>
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                                    <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">VPIP %</div>
                                    <div className="text-3xl font-bold text-white">{lifetimeStats.vpip}%</div>
                                    <div className="text-xs text-gray-500 mt-2">Voluntarily Put In Pot</div>
                                </div>
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                                    <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">PFR %</div>
                                    <div className="text-3xl font-bold text-white">{lifetimeStats.pfr}%</div>
                                    <div className="text-xs text-gray-500 mt-2">Pre-Flop Raise</div>
                                </div>
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                                    <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">AF</div>
                                    <div className="text-3xl font-bold text-white">{lifetimeStats.af}</div>
                                    <div className="text-xs text-gray-500 mt-2">Aggression Factor</div>
                                </div>
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                                    <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">3-Bet %</div>
                                    <div className="text-3xl font-bold text-white">{lifetimeStats.threeBet}%</div>
                                    <div className="text-xs text-gray-500 mt-2">Pre-Flop 3-Bet</div>
                                </div>
                            </div>

                            {/* Leakfinder Row 1: C-Bet & Showdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* C-Bet Analysis */}
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                    <h3 className="text-lg font-bold mb-4 text-gray-300">C-Bet Analysis</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Flop', CBet: parseFloat(lifetimeStats.cbetFlop) },
                                                { name: 'Turn', CBet: parseFloat(lifetimeStats.cbetTurn) },
                                                { name: 'River', CBet: parseFloat(lifetimeStats.cbetRiver) }
                                            ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                                <YAxis stroke="#9CA3AF" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF' }} />
                                                <Bar dataKey="CBet" fill="#F59E0B" name="C-Bet %" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 text-xs text-gray-400 text-center">
                                        {parseFloat(lifetimeStats.cbetFlop) > 70 && parseFloat(lifetimeStats.cbetTurn) < 40 && (
                                            <span className="text-red-400 font-bold">⚠️ High Flop C-Bet drops significantly on Turn. Opponents might float you.</span>
                                        )}
                                    </div>
                                </div>

                                {/* Showdown WTSD vs W$SD */}
                                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                    <h3 className="text-lg font-bold mb-4 text-gray-300">Showdown Analysis (WTSD vs W$SD)</h3>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="text-center">
                                            <div className="text-gray-400 text-xs uppercase mb-1">WTSD %</div>
                                            <div className={`text-xl font-bold ${parseFloat(lifetimeStats.wtsd) > 33 ? 'text-red-400' : 'text-white'}`}>{lifetimeStats.wtsd}%</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-gray-400 text-xs uppercase mb-1">W$SD %</div>
                                            <div className={`text-xl font-bold ${parseFloat(lifetimeStats.wsd) < 48 ? 'text-red-400' : 'text-green-400'}`}>{lifetimeStats.wsd}%</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-gray-400 text-xs uppercase mb-1">W$WSF %</div>
                                            <div className="text-xl font-bold text-blue-400">{lifetimeStats.wwsf}%</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 bg-gray-900 p-3 rounded-lg">
                                        {parseFloat(lifetimeStats.wtsd) > 33 && parseFloat(lifetimeStats.wsd) < 48 ? (
                                            <div className="text-red-400 font-bold">⚠️ Calling Station Alert: High WTSD & Low W$SD. You are calling too much on the river with losing hands.</div>
                                        ) : parseFloat(lifetimeStats.wtsd) < 22 ? (
                                            <div className="text-yellow-400 font-bold">⚠️ Weak-Tight Alert: Low WTSD. You might be folding too many winning hands.</div>
                                        ) : (
                                            <div className="text-green-400 font-bold">✅ Solid Showdown decisions.</div>
                                        )}
                                        <div className="mt-2 text-gray-500">W$WSF (Won $ When Saw Flop) &gt; 45% is aggressive post-flop play.</div>
                                    </div>
                                </div>
                            </div>

                            {/* Leakfinder Row 2: Positional Matrix */}
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                <h3 className="text-lg font-bold mb-4 text-gray-300">Positional Breakdown</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-400 uppercase bg-gray-900 border-b border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3">Position</th>
                                                <th className="px-4 py-3 text-right">Hands</th>
                                                <th className="px-4 py-3 text-right">VPIP %</th>
                                                <th className="px-4 py-3 text-right">PFR %</th>
                                                <th className="px-4 py-3 text-right">ATS % (Steal)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {['UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'].map(pos => {
                                                const stat = lifetimeStats.positionalStats[pos];
                                                if (!stat || stat.handsPlayed === 0) return null;
                                                const vpip = stat.handsPlayed ? (stat.vpipCount / stat.handsPlayed * 100).toFixed(1) : 0;
                                                const pfr = stat.handsPlayed ? (stat.pfrCount / stat.handsPlayed * 100).toFixed(1) : 0;
                                                const ats = stat.stealOpp ? (stat.stealCount / stat.stealOpp * 100).toFixed(1) : '-';
                                                
                                                return (
                                                    <tr key={pos} className="border-b border-gray-700 hover:bg-gray-700">
                                                        <td className="px-4 py-3 font-bold text-poker-gold">{pos}</td>
                                                        <td className="px-4 py-3 text-right text-gray-300">{stat.handsPlayed}</td>
                                                        <td className="px-4 py-3 text-right text-white">{vpip}%</td>
                                                        <td className="px-4 py-3 text-right text-white">{pfr}%</td>
                                                        <td className="px-4 py-3 text-right text-blue-400">{ats}{ats !== '-' ? '%' : ''}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : hands.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
                            No hands recorded for this session.
                        </div>
                    ) : (
                        <>
                            <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
                                <h2 className="text-lg font-bold mb-4 text-gray-300">Session Profit & Loss</h2>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                                            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickFormatter={(tick) => tick.split(' ')[1]} />
                                            <YAxis stroke="#9CA3AF" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#FFF' }}
                                                itemStyle={{ fontWeight: 'bold' }}
                                            />
                                            <Legend />
                                            <Line type="monotone" dataKey="NetWon" stroke="#10B981" name="Total Net Won (Green Line)" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="Showdown" stroke="#3B82F6" name="Showdown Winnings (Blue Line)" strokeWidth={2} dot={false} />
                                            <Line type="monotone" dataKey="NonShowdown" stroke="#EF4444" name="Non-Showdown (Red Line)" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden flex-1 flex flex-col">
                                <div className="p-4 border-b border-gray-700 bg-gray-800 flex flex-col gap-3">
                                    <h2 className="text-lg font-bold text-gray-300">Hand History ({filteredHands.length} hands)</h2>
                                    <div className="flex gap-4 items-center flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-400">Min Pot:</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                value={filterMinPot || ''} 
                                                onChange={e => setFilterMinPot(Number(e.target.value))}
                                                className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm w-24 text-white"
                                                placeholder="$0"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-400">Outcome:</label>
                                            <select 
                                                value={filterOutcome} 
                                                onChange={e => setFilterOutcome(e.target.value as any)}
                                                className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                            >
                                                <option value="all">All Hands</option>
                                                <option value="won">Won Only</option>
                                                <option value="lost">Lost Only</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-400">Hole Cards:</label>
                                            <input 
                                                type="text" 
                                                value={filterCards} 
                                                onChange={e => setFilterCards(e.target.value)}
                                                className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm w-32 text-white"
                                                placeholder="e.g. A, K, Ah"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                                    {filteredHands.length === 0 ? (
                                        <div className="text-center text-gray-500 py-4">No hands match the current filters.</div>
                                    ) : (
                                        filteredHands.map(h => (
                                            <div 
                                                key={h.id} 
                                            onClick={() => setSelectedHand(h)}
                                            className="bg-gray-900 border border-gray-700 rounded p-3 flex justify-between items-center cursor-pointer hover:bg-gray-800 transition"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 text-center bg-gray-800 p-1 rounded text-xs font-bold text-gray-400">
                                                    Hand {h.handNumber}
                                                </div>
                                                <div className="flex gap-1">
                                                    {h.heroCards.map((c, i) => (
                                                        <Card key={i} card={parseCardString(c)} mini />
                                                    ))}
                                                </div>
                                                <div className="text-gray-500">|</div>
                                                <div className="flex gap-1">
                                                    {h.boardCards.map((c, i) => (
                                                        <Card key={i} card={parseCardString(c)} mini />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-4 items-center">
                                                <div className="text-sm text-gray-400">Pot: ${h.potSize}</div>
                                                <div className={`text-sm font-bold w-16 text-right ${h.heroNetWon > 0 ? 'text-green-400' : h.heroNetWon < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                                    {h.heroNetWon > 0 ? '+' : ''}{h.heroNetWon}
                                                </div>
                                            </div>
                                        </div>
                                    )))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Hand Details Modal */}
            {selectedHand && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedHand(null)}>
                    <div 
                        className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-xl">
                            <h2 className="text-xl font-bold text-poker-gold">Hand {selectedHand.handNumber} Details</h2>
                            <button 
                                onClick={() => setSelectedHand(null)}
                                className="text-gray-400 hover:text-white text-3xl leading-none transition"
                            >
                                &times;
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                            {/* Cards Summary */}
                            <div className="flex gap-8 items-center bg-gray-900 p-4 rounded-lg border border-gray-700">
                                <div>
                                    <div className="text-sm text-gray-400 mb-2">Your Cards</div>
                                    <div className="flex gap-2">
                                        {selectedHand.heroCards.map((c, i) => (
                                            <Card key={i} card={parseCardString(c)} small />
                                        ))}
                                    </div>
                                </div>
                                <div className="h-12 w-px bg-gray-700 mx-4"></div>
                                <div>
                                    <div className="text-sm text-gray-400 mb-2">Board</div>
                                    <div className="flex gap-2">
                                        {selectedHand.boardCards.length > 0 ? selectedHand.boardCards.map((c, i) => (
                                            <Card key={i} card={parseCardString(c)} small />
                                        )) : <span className="text-gray-500 italic py-2">No board cards</span>}
                                    </div>
                                </div>
                                <div className="ml-auto text-right">
                                    <div className="text-sm text-gray-400 mb-1">Total Pot</div>
                                    <div className="text-xl font-bold text-poker-gold">${selectedHand.potSize}</div>
                                    <div className={`text-sm font-bold ${selectedHand.heroNetWon > 0 ? 'text-green-400' : selectedHand.heroNetWon < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                        Net: {selectedHand.heroNetWon > 0 ? '+' : ''}{selectedHand.heroNetWon}
                                    </div>
                                </div>
                            </div>

                            {/* Action Log */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-300 mb-3">Action Log</h3>
                                <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 font-mono text-sm">
                                    {selectedHand.actionLog && selectedHand.actionLog.length > 0 ? (
                                        selectedHand.actionLog.map((action, i) => {
                                            const isHero = action.toLowerCase().startsWith(user?.username?.toLowerCase() || 'hero');
                                            const isPhase = action.startsWith('---');
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`py-1 ${isHero ? 'text-blue-400 font-bold' : isPhase ? 'text-poker-gold mt-2 mb-1 font-bold' : 'text-gray-300'}`}
                                                >
                                                    {action}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-gray-500 italic">No action log available for this hand.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
