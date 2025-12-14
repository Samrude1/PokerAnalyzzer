import { Player } from '../game/types';

interface GameOverScreenProps {
    players: Player[];
    onPlayAgain: () => void;
}

export function GameOverScreen({ players, onPlayAgain }: GameOverScreenProps) {
    const sortedPlayers = [...players].sort((a, b) => b.chips - a.chips);
    const winner = sortedPlayers[0];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border-2 border-poker-gold/30 shadow-2xl">
                {/* Trophy */}
                <div className="text-6xl text-center mb-3">🏆</div>

                {/* Winner Announcement */}
                <h1 className="text-2xl font-bold text-poker-gold text-center mb-1">Game Over!</h1>
                <h2 className="text-lg text-white text-center mb-4">
                    <span className="text-poker-gold">{winner.name}</span> wins!
                </h2>

                {/* Final Standings - Compact */}
                <div className="bg-gray-900/50 rounded-lg p-3 mb-4 border border-poker-gold/20">
                    <h3 className="text-sm font-bold text-gray-400 mb-2">Final Standings</h3>
                    <div className="space-y-1">
                        {sortedPlayers.map((player, index) => (
                            <div
                                key={player.id}
                                className={`flex items-center justify-between p-2 rounded ${index === 0
                                        ? 'bg-poker-gold/20 border border-poker-gold/50'
                                        : 'bg-gray-700/30'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${index === 0 ? 'text-poker-gold' : 'text-gray-400'
                                        }`}>
                                        #{index + 1}
                                    </span>
                                    <span className={`text-sm ${index === 0 ? 'text-poker-gold font-bold' : 'text-white'}`}>
                                        {player.name}
                                        {player.isHuman && <span className="text-blue-400 text-xs ml-1">(You)</span>}
                                    </span>
                                </div>
                                <span className={`text-sm font-bold ${player.chips > 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    ${player.chips}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Play Again Button */}
                <button
                    onClick={onPlayAgain}
                    className="w-full px-8 py-3 bg-gradient-to-r from-poker-gold to-yellow-600 rounded-full text-black font-extrabold text-lg shadow-xl hover:scale-105 transition-transform"
                >
                    Play Again
                </button>
            </div>
        </div>
    );
}
