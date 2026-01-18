import clsx from 'clsx';
import { Player } from '../game/types';
import { Card } from './Card';

interface SeatProps {
    player?: Player;
    position: number;
    isHero?: boolean;
    activePlayerId?: string;
    showCards?: boolean;
    isDealer?: boolean;
    animateCards?: boolean;
    onBuyIn?: (playerId: string) => void;
    maxBuyIn?: number;
}


const POSITIONS = [
    'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2', // 0 Hero
    'bottom-0 left-2 translate-y-8', // 1 - further left, pushed down
    'top-4 left-2', // 2 - further left, closer to top
    'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2', // 3
    'top-4 right-2', // 4 - further right, closer to top
    'bottom-0 right-2 translate-y-8', // 5 - further right, pushed down
];

export function Seat({ player, position, isHero, activePlayerId, showCards, isDealer, animateCards, onBuyIn, maxBuyIn = 200 }: SeatProps) {
    if (!player) {
        return (
            <div className={clsx(
                "absolute w-24 h-24 flex items-center justify-center",
                POSITIONS[position]
            )}>
                <div className="px-4 py-2 bg-black/30 rounded-full border border-white/10 text-white/30 text-xs">
                    Empty
                </div>
            </div>
        );
    }

    const isActive = player.id === activePlayerId;

    const getActionColor = (action: string) => {
        if (action === 'fold') return 'bg-red-600/90';
        if (action === 'raise' || action === 'bet') return 'bg-poker-gold/90 text-black';
        if (action === 'call') return 'bg-blue-600/90';
        if (action === 'check') return 'bg-gray-600/90';
        return 'bg-gray-700/90';
    };

    const actionText = player.lastAction === 'raise' && player.currentBet > 0
        ? `Raise $${player.currentBet}`
        : player.lastAction === 'call' && player.currentBet > 0
            ? `Call`
            : player.lastAction;

    return (
        <div className={clsx(
            "absolute flex flex-col items-center justify-center w-40 h-40 transition-all duration-300 group",
            POSITIONS[position],
            player.status === 'folded' && "opacity-60"
        )}>
            {/* Turn Indicator - Pulsing ring */}
            {isActive && (
                <div className="absolute inset-0 rounded-full border-4 border-poker-gold animate-pulse z-0" />
            )}

            {/* Content Container */}
            <div className="relative flex flex-col items-center">

                {/* Cards - MOVED HIGHER to prevent overlap */}
                <div className={clsx(
                    "absolute left-1/2 -translate-x-1/2 flex -space-x-4 w-max pointer-events-none overflow-visible",
                    isHero ? "-top-24 z-20" : "-top-24 z-10" // Higher for larger cards
                )}>
                    {player.cards.length > 0 ? (
                        player.cards.map((card, i) => (
                            <Card
                                key={i}
                                card={isHero || showCards ? card : undefined}
                                hidden={!isHero && !showCards}
                                className="shadow-xl"
                                animateIn={animateCards}
                                animationDelay={position * 100 + i * 80}
                                flipReveal={showCards && !isHero}
                            />
                        ))
                    ) : (
                        <div className="w-14 h-20 opacity-0" />
                    )}
                </div>

                {/* Avatar Circle - LARGER */}
                <div className={clsx(
                    "w-24 h-24 rounded-full border-4 flex items-center justify-center bg-gray-800 relative shadow-lg transition-transform duration-300 z-20",
                    isActive ? "border-poker-gold bg-gray-700 scale-110 shadow-[0_0_20px_#d4af37]" : "border-gray-600",
                    player.status === 'folded' && "grayscale border-gray-700"
                )}>
                    <div className="text-center">
                        <div className="text-sm font-bold text-gray-300 truncate w-20 px-1">{player.name}</div>
                        <div className="text-poker-gold font-mono text-lg font-bold">${player.chips}</div>
                    </div>

                    {/* Action Bubble - Right side of avatar */}
                    {player.lastAction && player.status !== 'folded' && (
                        <div className={clsx(
                            "absolute z-50 px-3 py-1 rounded-full text-xs font-bold shadow-lg text-white whitespace-nowrap pointer-events-none transition-all duration-300",
                            "left-full ml-2 top-1/2 -translate-y-1/2",
                            getActionColor(player.lastAction)
                        )}>
                            {actionText}
                        </div>
                    )}
                </div>

                {/* Dealer Button */}
                {isDealer && (
                    <div className="absolute top-0 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-gray-300 z-30">
                        <span className="text-black font-bold text-sm select-none">D</span>
                    </div>
                )}

                {/* Small Blind / Big Blind Badge */}
                {(player.role === 'small-blind' || player.role === 'big-blind') && (
                    <div className="absolute bottom-0 -left-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-30">
                        <span className="text-white font-bold text-[11px] select-none">
                            {player.role === 'small-blind' ? 'SB' : 'BB'}
                        </span>
                    </div>
                )}

                {/* Current Bet - LARGER */}
                {player.currentBet > 0 && (
                    <div className="absolute bottom-0 -right-16 z-40 flex items-center gap-1.5 animate-fadeIn">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 border-2 border-white/30 shadow-md flex items-center justify-center">
                            <div className="w-4 h-4 rounded-full border border-white/40" />
                        </div>
                        <div className="bg-black/70 px-3 py-1 rounded-lg text-white text-sm font-mono font-bold backdrop-blur-sm">
                            ${player.currentBet}
                        </div>
                    </div>
                )}

                {/* Stats Rows */}
                {player.status !== 'eliminated' && (
                    <div className="absolute -bottom-16 flex flex-col gap-0.5 items-center z-30">
                        {/* Row 1: VPIP | PFR | 3B */}
                        <div className="flex gap-1 bg-black/70 px-2 py-0.5 rounded text-xs font-bold backdrop-blur-sm border border-gray-700 whitespace-nowrap">
                            {(() => {
                                const h = player.stats.handsPlayed;
                                const v = h > 0 ? Math.round((player.stats.vpipCount / h) * 100) : 0;
                                const p = h > 0 ? Math.round((player.stats.pfrCount / h) * 100) : 0;
                                const threeBet = player.stats.threeBetOpportunity > 0
                                    ? ((player.stats.threeBetCount / player.stats.threeBetOpportunity) * 100).toFixed(1)
                                    : '0.0';
                                const vColor = v > 40 ? 'text-green-400' : v < 15 ? 'text-red-400' : 'text-gray-300';
                                return (
                                    <>
                                        <span className={vColor} title="VPIP">V:{v}</span>
                                        <span className="text-gray-500">|</span>
                                        <span className="text-blue-300" title="PFR">P:{p}</span>
                                        <span className="text-gray-500">|</span>
                                        <span className="text-purple-300" title="3-Bet%">3B:{threeBet}</span>
                                    </>
                                );
                            })()}
                        </div>
                        {/* Row 2: AF | WTSD | W$SD */}
                        <div className="flex gap-1 bg-black/70 px-2 py-0.5 rounded text-[11px] font-bold backdrop-blur-sm border border-gray-700 whitespace-nowrap">
                            {(() => {
                                const h = player.stats.handsPlayed;
                                const af = player.stats.af.toFixed(1);
                                const wtsd = h > 0 ? Math.round((player.stats.showdownsReached / h) * 100) : 0;
                                const wsd = player.stats.showdownsReached > 0 ? Math.round((player.stats.showdownsWon / player.stats.showdownsReached) * 100) : 0;
                                return (
                                    <>
                                        <span className="text-orange-300" title="AF">AF:{af}</span>
                                        <span className="text-gray-500">|</span>
                                        <span className="text-blue-200" title="WTSD">Wt:{wtsd}</span>
                                        <span className="text-gray-500">|</span>
                                        <span className="text-green-300" title="W$SD">W$:{wsd}</span>
                                    </>
                                );
                            })()}
                        </div>
                        {/* Row 3: Hands Played | Session Winnings */}
                        <div className="flex gap-1 bg-black/70 px-2 py-0.5 rounded text-[11px] font-bold backdrop-blur-sm border border-gray-700 whitespace-nowrap">
                            {(() => {
                                const hands = player.stats.handsPlayed;
                                const winnings = player.stats.sessionPnL;
                                const winColor = winnings >= 0 ? 'text-green-400' : 'text-red-400';
                                return (
                                    <>
                                        <span className="text-gray-300" title="Hands Played">H:{hands}</span>
                                        <span className="text-gray-500">|</span>
                                        <span className={winColor} title="Session Winnings">
                                            {winnings >= 0 ? '+' : ''}{winnings}
                                        </span>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* Top Up / Buy In Button */}
                {onBuyIn && (player.status === 'eliminated' || player.chips < maxBuyIn) && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onBuyIn(player.id);
                        }}
                        className={clsx(
                            "absolute z-50 rounded-lg flex items-center justify-center font-bold shadow-lg transition-all transform hover:scale-110 active:scale-95 border gap-1",
                            player.status === 'eliminated'
                                ? "bg-green-600 hover:bg-green-500 text-white border-green-400 animate-pulse top-20 scale-125 px-4 py-2 text-sm" // Prominent if eliminated
                                : "bg-green-700/80 hover:bg-green-600 text-white border-green-500 bottom-0 -right-24 px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100" // Hidden until hover
                        )}
                        title={player.status === 'eliminated' ? "Buy In" : "Refill Stack to $200"}
                    >
                        <span className="text-base">{player.status === 'eliminated' ? "💰" : "↺"}</span>
                        {player.status === 'eliminated' ? "Buy In" : "Refill"}
                    </button>
                )}
            </div>
        </div>
    );
}
