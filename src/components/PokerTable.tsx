import { GameState } from '../game/types';
import { Seat } from './Seat';
import { Card } from './Card';
import { useRef, useEffect, useState } from 'react';

interface PokerTableProps {
    gameState: GameState;
    onBuyIn: (playerId: string) => void;
}

export function PokerTable({ gameState, onBuyIn }: PokerTableProps) {
    const heroIndex = gameState.players.findIndex(p => p.isHuman);
    const rotatedPlayers = [...gameState.players];
    if (heroIndex !== -1) {
        const hero = rotatedPlayers.splice(heroIndex, 1)[0];
        rotatedPlayers.unshift(hero);
    }

    // Track hand number to trigger deal animations on new hands
    const prevHandRef = useRef(gameState.handNumber);
    const [animateCards, setAnimateCards] = useState(false);

    useEffect(() => {
        if (gameState.handNumber !== prevHandRef.current) {
            setAnimateCards(true);
            prevHandRef.current = gameState.handNumber;
            // Reset after animation completes
            const timer = setTimeout(() => setAnimateCards(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [gameState.handNumber]);

    // Track community cards for staggered reveal
    const prevCommunityCount = useRef(gameState.communityCards.length);
    const [newCardIndex, setNewCardIndex] = useState(-1);

    useEffect(() => {
        const currentCount = gameState.communityCards.length;
        if (currentCount > prevCommunityCount.current) {
            setNewCardIndex(prevCommunityCount.current);
            prevCommunityCount.current = currentCount;
        }
    }, [gameState.communityCards.length]);

    return (
        <div className="relative w-full max-w-5xl aspect-[2/1] bg-poker-felt rounded-[80px] border-[12px] border-poker-felt/50 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] flex items-center justify-center mx-auto">
            {/* Felt Texture/Logo */}
            <div className="absolute font-serif text-poker-gold/20 text-6xl font-bold select-none pointer-events-none">
                POKER
            </div>

            {/* Community Cards */}
            <div className="flex gap-2 items-center bg-black/20 p-4 rounded-full border border-white/5 z-30">
                {gameState.communityCards.map((card, i) => (
                    <Card
                        key={`${gameState.handNumber}-${i}`}
                        card={card}
                        large
                        animateIn={i >= newCardIndex}
                        animationDelay={i >= newCardIndex ? (i - newCardIndex) * 150 : 0}
                    />
                ))}
                {Array.from({ length: 5 - gameState.communityCards.length }).map((_, i) => (
                    <div key={`placeholder-${i}`} className="w-24 h-36 border-2 border-dashed border-white/10 rounded-md bg-white/5" />
                ))}
            </div>

            {/* Pot Display - Positioned above community cards */}
            <div className="absolute top-[12%] left-[35%] -translate-x-1/2 px-4 py-1.5 bg-black/70 rounded-full text-white font-mono border border-poker-gold/20 shadow-md backdrop-blur-sm z-40">
                <div className="text-[10px] text-gray-400 text-center uppercase tracking-wider">Pot</div>
                <div className="text-base font-bold text-poker-gold">${gameState.pot}</div>
            </div>

            {/* Seats */}
            {Array.from({ length: 6 }).map((_, i) => {
                const player = rotatedPlayers[i];
                const isDealer = player
                    ? gameState.players.indexOf(player) === gameState.dealerIndex
                    : false;

                // Only show cards at showdown if player was active or all-in (not folded)
                // AND it's a true showdown (not won by default/folds)
                const isWalk = gameState.winnerInfo?.handDescription === 'Everyone else folded';
                const shouldShowCards = gameState.phase === 'showdown' &&
                    !isWalk &&
                    player &&
                    (player.status === 'active' || player.status === 'all-in');

                return (
                    <Seat
                        key={i}
                        position={i}
                        player={player}
                        isHero={player?.isHuman}
                        activePlayerId={gameState.activePlayerId}
                        showCards={shouldShowCards}
                        isDealer={isDealer}
                        animateCards={animateCards}
                        onBuyIn={onBuyIn}
                    />
                );
            })}
        </div>
    );
}
