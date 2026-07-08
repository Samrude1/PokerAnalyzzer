import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService, SavedSession, SavedHand } from '../services/StorageService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export const StatisticsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SavedSession[]>([]);
    const [mode, setMode] = useState<'cash' | 'tournament'>('cash');
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [hands, setHands] = useState<SavedHand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedHand, setSelectedHand] = useState<SavedHand | null>(null);

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

    // Automatically select first session when mode changes
    useEffect(() => {
        if (filteredSessions.length > 0 && !filteredSessions.find(s => s.id === selectedSessionId)) {
            setSelectedSessionId(filteredSessions[0].id);
        } else if (filteredSessions.length === 0) {
            setSelectedSessionId(null);
        }
    }, [mode, filteredSessions, selectedSessionId]);

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
                    {isLoading ? (
                        <div className="animate-pulse text-gray-500">Loading...</div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-gray-500">No sessions found.</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filteredSessions.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedSessionId(s.id)}
                                    className={`p-3 rounded-lg text-left transition border ${selectedSessionId === s.id ? 'bg-gray-700 border-poker-gold' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                                >
                                    <div className="text-sm font-bold text-gray-200">{new Date(s.date).toLocaleString()}</div>
                                    <div className="text-xs text-gray-400 mt-1">Difficulty: {s.difficulty}</div>
                                    <div className={`text-sm font-bold mt-2 ${s.chipsWon >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {s.chipsWon > 0 ? '+' : ''}{s.chipsWon} {mode === 'cash' ? 'Chips' : 'Net'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                    {!selectedSessionId ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            Select a session to view analysis.
                        </div>
                    ) : hands.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            No hands recorded for this session.
                        </div>
                    ) : (
                        <>
                            <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700 mb-6">
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
                                <div className="p-4 border-b border-gray-700 bg-gray-800">
                                    <h2 className="text-lg font-bold text-gray-300">Hand History ({hands.length} hands)</h2>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                                    {hands.map(h => (
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
                                                        <span key={i} className="px-1.5 py-0.5 bg-white text-black font-bold rounded text-xs">
                                                            {c}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="text-gray-500">|</div>
                                                <div className="flex gap-1">
                                                    {h.boardCards.map((c, i) => (
                                                        <span key={i} className="px-1.5 py-0.5 bg-gray-200 text-black font-bold rounded text-xs">
                                                            {c}
                                                        </span>
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
                                    ))}
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
                                            <span key={i} className="px-3 py-1 bg-white text-black font-bold rounded shadow">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {selectedHand.boardCards.length > 0 && (
                                    <>
                                        <div className="h-10 w-px bg-gray-700"></div>
                                        <div>
                                            <div className="text-sm text-gray-400 mb-2">Board</div>
                                            <div className="flex gap-2">
                                                {selectedHand.boardCards.map((c, i) => (
                                                    <span key={i} className="px-3 py-1 bg-gray-200 text-black font-bold rounded shadow">
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
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
