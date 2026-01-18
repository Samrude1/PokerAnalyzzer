import { HandHistory, Position } from '../game/types';

interface PositionalStatsTableProps {
    sessionHands: HandHistory[];
}

export function PositionalStatsTable({ sessionHands }: PositionalStatsTableProps) {
    const positions: Position[] = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];

    const getStats = (pos: Position) => {
        const hands = sessionHands.filter(h => h.heroPosition === pos);
        const count = hands.length;
        const profit = hands.reduce((acc, h) => acc + h.heroNetWon, 0);
        // bb/100 calculation pending availability of BB amount in metadata

        return { count, profit };
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-400">
                <thead className="bg-gray-900 uppercase font-medium border-b border-gray-700">
                    <tr>
                        <th className="px-4 py-3">Position</th>
                        <th className="px-4 py-3">Hands</th>
                        <th className="px-4 py-3">Profit</th>
                        <th className="px-4 py-3">Win/Hand</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {positions.map(pos => {
                        const { count, profit } = getStats(pos);
                        return (
                            <tr key={pos} className="hover:bg-gray-700/50">
                                <td className="px-4 py-3 font-bold text-white">{pos}</td>
                                <td className="px-4 py-3">{count}</td>
                                <td className={`px-4 py-3 font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${profit.toFixed(2)}
                                </td>
                                <td className={`px-4 py-3 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    ${count > 0 ? (profit / count).toFixed(2) : '0.00'}
                                </td>
                            </tr>
                        );
                    })}
                    {/* Summary Row */}
                    <tr className="bg-gray-900/50 font-bold border-t-2 border-gray-700">
                        <td className="px-4 py-3 text-poker-gold">Total</td>
                        <td className="px-4 py-3">{sessionHands.filter(h => h.heroPosition).length}</td>
                        <td className={`px-4 py-3 ${sessionHands.reduce((acc, h) => h.heroPosition ? acc + h.heroNetWon : acc, 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${sessionHands.reduce((acc, h) => h.heroPosition ? acc + h.heroNetWon : acc, 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">-</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
