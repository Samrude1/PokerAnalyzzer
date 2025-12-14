import { HandHistory } from '../game/types';
import { Card } from './Card';

interface HandDetailsModalProps {
    hand: HandHistory;
    onClose: () => void;
}

export function HandDetailsModal({ hand, onClose }: HandDetailsModalProps) {
    // Prevent event bubbling to parent (which might be the SessionDashboard row click)
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-poker-gold/50 overflow-hidden transform transition-all scale-100"
                onClick={handleContentClick}
            >
                {/* Header */}
                <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-poker-gold">Hand #{hand.handNumber}</h3>
                        <p className="text-sm text-gray-400">
                            {hand.isShowdown ? 'Showdown' : 'Won without Showdown'} • Pot: ${hand.finalPot}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 bg-gradient-to-br from-gray-800 to-gray-900">

                    {/* Community Cards */}
                    <div className="text-center">
                        <h4 className="text-gray-400 text-sm uppercase tracking-widest mb-4">Community Cards</h4>
                        <div className="flex justify-center gap-3">
                            {hand.communityCards.length > 0 ? (
                                hand.communityCards.map((card, i) => (
                                    <div key={i} className="shadow-2xl">
                                        <Card card={card} large={true} />
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic py-8">No community cards dealt</p>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-gray-700/50 w-full" />

                    {/* Hero Cards */}
                    <div className="text-center">
                        <h4 className="text-gray-400 text-sm uppercase tracking-widest mb-4">Your Hand</h4>
                        <div className="flex justify-center gap-3">
                            {hand.heroCards.map((card, i) => (
                                <div key={i} className="shadow-2xl hover:transform hover:-translate-y-2 transition-transform duration-300">
                                    <Card card={card} large={true} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Result Summary */}
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 flex justify-between items-center">
                        <div>
                            <span className="text-gray-400 text-sm">Net Result: </span>
                            <span className={`text-xl font-bold ${hand.heroNetWon >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {hand.heroNetWon >= 0 ? '+' : ''}{hand.heroNetWon} Chips
                            </span>
                        </div>
                        {hand.winnerIds.length > 0 && (
                            <div className="text-right">
                                <span className="text-gray-400 text-sm">Winner(s): </span>
                                <span className="text-poker-gold font-bold">
                                    {hand.winnerIds.includes(hand.heroCards[0] ? 'p1' : '') ? 'You' : hand.winnerIds.join(', ')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Log */}
                    {hand.actionLog && hand.actionLog.length > 0 && (
                        <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/30">
                            <h4 className="text-gray-400 text-xs uppercase tracking-widest mb-2 font-bold">Hand Action Log</h4>
                            <div className="text-sm font-mono text-gray-300 space-y-1 max-h-40 overflow-y-auto pr-2">
                                {hand.actionLog.map((log, i) => (
                                    <div key={i} className={log.startsWith('---') ? 'text-poker-gold font-bold mt-2' : ''}>
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
