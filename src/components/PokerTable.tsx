import { GameState } from '../game/types';
import { Seat } from './Seat';
import { Card } from './Card';
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';

interface PokerTableProps {
    gameState: GameState;
    onBuyIn?: (playerId: string) => void;
    mode?: 'cash' | 'tournament' | 'sng';
    isFinalTable?: boolean;
}

export function PokerTable({ gameState, onBuyIn, mode, isFinalTable }: PokerTableProps) {
    // Leave empty seats for eliminated bots instead of shrinking the table visually
    const { rotatedPlayers } = useMemo(() => {
        const active = gameState.players.map(p => {
            if (!p.isHuman && p.status === 'eliminated') return undefined;
            return p;
        });
        const heroIndex = active.findIndex(p => p?.isHuman);
        let rotated = [...active];
        if (heroIndex !== -1) {
            rotated = [
                ...active.slice(heroIndex),
                ...active.slice(0, heroIndex)
            ];
        }
        return { rotatedPlayers: rotated };
    }, [gameState.players]);

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
        if (currentCount === 0) {
            prevCommunityCount.current = 0;
            setNewCardIndex(0);
        } else if (currentCount > prevCommunityCount.current) {
            setNewCardIndex(prevCommunityCount.current);
            prevCommunityCount.current = currentCount;
        }
    }, [gameState.communityCards.length]);

    const getRunoutDelay = useCallback((cardIndex: number, startIndex: number) => {
        if (cardIndex < startIndex) return 0;
        
        // If dealing multiple streets at once (all-in runout)
        const dealtCount = gameState.communityCards.length - startIndex;
        if (dealtCount > 1 && cardIndex >= 3) {
            if (cardIndex === 3) return (startIndex < 4) ? 800 : 0; // Turn
            if (cardIndex === 4) return (startIndex < 5) ? (startIndex < 4 ? 1600 : 800) : 0; // River
        }
        
        // Normal dealing
        return (cardIndex - startIndex) * 150;
    }, [gameState.communityCards.length]);

    return (
        <div className={`relative w-full max-w-5xl aspect-[2/1] rounded-[80px] border-[12px] shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] flex items-center justify-center mx-auto transition-colors duration-1000 ${
            isFinalTable 
                ? 'bg-red-800 border-red-900/80 shadow-[inset_0_0_100px_rgba(150,0,0,0.4)]'
                : 'bg-poker-felt border-poker-felt/50'
        }`}>
            {/* Felt Texture/Logo */}
            <div className={`absolute font-serif text-6xl font-bold select-none pointer-events-none transition-colors duration-1000 ${
                isFinalTable ? 'text-black/20' : 'text-poker-gold/20'
            }`}>
                {isFinalTable ? 'FINAL TABLE' : 'POKER'}
            </div>

            {/* Community Cards */}
            <div className="flex gap-2 items-center bg-black/20 p-4 rounded-full border border-white/5 z-30">
                {gameState.communityCards.map((card, i) => (
                    <Card
                        key={`${gameState.handNumber}-${i}`}
                        card={card}
                        animateIn={i >= newCardIndex}
                        animationDelay={getRunoutDelay(i, newCardIndex)}
                    />
                ))}
                {Array.from({ length: 5 - gameState.communityCards.length }).map((_, i) => (
                    <div key={`placeholder-${i}`} className="w-24 h-36 border-2 border-dashed border-white/10 rounded-md bg-white/5" />
                ))}
            </div>

            {/* Pot Display - Positioned above community cards */}
            <div className="absolute top-[25%] left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/70 rounded-full text-white font-mono border border-poker-gold/20 shadow-md backdrop-blur-sm z-40">
                <div className="text-[10px] text-gray-400 text-center uppercase tracking-wider">Pot</div>
                <div className="text-base font-bold text-poker-gold">${gameState.pot}</div>
            </div>

            {/* Seats */}
            {rotatedPlayers.map((player, i) => {
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
                        mode={mode}
                        totalSeats={Math.max(6, rotatedPlayers.length)}
                        smallBlind={gameState.smallBlindAmount}
                        bigBlind={gameState.bigBlindAmount}
                    />
                );
            })}
        </div>
    );
}
