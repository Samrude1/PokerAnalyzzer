import { HandHistory } from '../game/types';
import { Player } from '../game/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { HandDetailsModal } from './HandDetailsModal';

interface SessionDashboardProps {
    sessionHands: HandHistory[];
    hero: Player;
    onClose: () => void;
}

export function SessionDashboard({ sessionHands, hero, onClose }: SessionDashboardProps) {
    const [selectedHand, setSelectedHand] = useState<HandHistory | null>(null);

    // Calculate cumulative values for graph
    interface GraphDataPoint {
        handNumber: number;
        netWon: number;
        showdownWon: number;
        nonShowdownWon: number;
        allInEV: number;
    }

    const graphData: GraphDataPoint[] = sessionHands.reduce((acc: GraphDataPoint[], hand, index) => {
        const prevData: GraphDataPoint = index > 0 ? acc[index - 1] : { handNumber: 0, netWon: 0, showdownWon: 0, nonShowdownWon: 0, allInEV: 0 };

        acc.push({
            handNumber: hand.handNumber,
            netWon: prevData.netWon + hand.heroNetWon,
            showdownWon: prevData.showdownWon + hand.heroShowdownWon,
            nonShowdownWon: prevData.nonShowdownWon + hand.heroNonShowdownWon,
            allInEV: prevData.allInEV + hand.heroAllInEV
        });

        return acc;
    }, []);

    // Prepend initial zero point so chart starts at origin
    if (graphData.length > 0) {
        graphData.unshift({
            handNumber: 0,
            netWon: 0,
            showdownWon: 0,
            nonShowdownWon: 0,
            allInEV: 0
        });
    }

    // Calculate key stats
    const handsPlayed = hero.stats.handsPlayed;
    const vpip = handsPlayed > 0 ? ((hero.stats.vpipCount / handsPlayed) * 100).toFixed(1) : '0.0';
    const pfr = handsPlayed > 0 ? ((hero.stats.pfrCount / handsPlayed) * 100).toFixed(1) : '0.0';
    const threeBet = hero.stats.threeBetOpportunity > 0
        ? ((hero.stats.threeBetCount / hero.stats.threeBetOpportunity) * 100).toFixed(1)
        : '0.0';
    const af = (hero.stats.raisesCount + hero.stats.betsCount) > 0
        ? ((hero.stats.raisesCount + hero.stats.betsCount) / hero.stats.callsCount).toFixed(2)
        : '0.00';

    const winRate = handsPlayed > 0 ? ((hero.stats.sessionPnL / handsPlayed) * 50).toFixed(1) : '0.0'; // bb/100 (simplified)

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-poker-gold/30 relative">
                {/* Header */}
                <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-3xl font-bold text-poker-gold">Session Analysis</h2>
                        <p className="text-gray-400 text-sm mt-1">{handsPlayed} hands played</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-bold transition"
                    >
                        ✕ Close
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <StatCard label="VPIP" value={`${vpip}%`} color="text-green-400" />
                        <StatCard label="PFR" value={`${pfr}%`} color="text-blue-400" />
                        <StatCard label="3-Bet" value={`${threeBet}%`} color="text-purple-400" />
                        <StatCard label="AF" value={af} color="text-yellow-400" />
                        <StatCard label="bb/100" value={winRate} color={parseFloat(winRate) >= 0 ? 'text-green-400' : 'text-red-400'} />
                    </div>

                    {/* Graph */}
                    {graphData.length > 0 ? (
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4">Session Graph</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={graphData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis
                                        dataKey="handNumber"
                                        stroke="#9CA3AF"
                                        label={{ value: 'Hand Number', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        label={{ value: 'Chips Won/Lost', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                        labelStyle={{ color: '#F3F4F6' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="netWon" stroke="#10B981" name="Net Won (Green)" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="allInEV" stroke="#FBBF24" name="All-In EV (Yellow)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                    <Line type="monotone" dataKey="nonShowdownWon" stroke="#EF4444" name="Non-Showdown (Red)" strokeWidth={1.5} dot={false} />
                                    <Line type="monotone" dataKey="showdownWon" stroke="#3B82F6" name="Showdown (Blue)" strokeWidth={1.5} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                            <p className="text-gray-400 text-lg">No hands played yet. Start playing to see your session graph!</p>
                        </div>
                    )}

                    {/* Hand List */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Hand History</h3>
                            <span className="text-sm text-gray-400">Click a hand to view details</span>
                        </div>
                        {sessionHands.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {sessionHands.slice().reverse().map((hand, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedHand(hand)}
                                        className="w-full flex justify-between items-center bg-gray-900 p-3 rounded-lg hover:bg-gray-700 hover:border-l-4 hover:border-poker-gold transition-all duration-150 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-400 font-mono text-sm group-hover:text-white">#{hand.handNumber}</span>
                                            <span className="text-white font-medium">
                                                {hand.isShowdown ? '🃏 Showdown' : '🚫 Fold Win'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-400 text-sm">Pot: ${hand.finalPot}</span>
                                            <span className={`font-bold ${hand.heroNetWon >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {hand.heroNetWon >= 0 ? '+' : ''}{hand.heroNetWon}
                                            </span>
                                            <span className="text-gray-500 group-hover:text-poker-gold">ℹ️</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-4">No hands recorded yet.</p>
                        )}
                    </div>
                </div>

                {/* Hand Details Modal */}
                {selectedHand && (
                    <HandDetailsModal
                        hand={selectedHand}
                        onClose={() => setSelectedHand(null)}
                    />
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
        </div>
    );
}
