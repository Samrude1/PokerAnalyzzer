import { WinnerInfo } from '../game/types';

interface ShowdownOverlayProps {
    winnerInfo: WinnerInfo;
    players: any[];
}

export function ShowdownOverlay({ winnerInfo, players }: ShowdownOverlayProps) {
    const winnerNames = winnerInfo.playerIds
        .map(id => players.find(p => p.id === id)?.name)
        .filter(Boolean)
        .join(', ');

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg px-6 py-3 border-2 border-poker-gold/40 shadow-xl animate-fadeIn">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <div>
                        <div className="text-poker-gold font-bold text-lg">
                            {winnerNames} wins ${winnerInfo.potWon}
                        </div>
                        <div className="text-gray-300 text-sm">
                            {winnerInfo.handDescription}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
