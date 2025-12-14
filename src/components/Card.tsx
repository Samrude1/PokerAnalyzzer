import clsx from 'clsx';
import { Card as CardType } from '../game/Deck';
import { useState, useEffect } from 'react';

interface CardProps {
    card?: CardType;
    hidden?: boolean;
    className?: string;
    large?: boolean;
    animateIn?: boolean;
    animationDelay?: number;
    flipReveal?: boolean;
}

const SUIT_MAP: Record<string, string> = {
    h: 'Hearts',
    d: 'Diamonds',
    c: 'Clubs',
    s: 'Spades',
};

export function Card({ card, hidden, className, large, animateIn, animationDelay = 0, flipReveal }: CardProps) {
    const [isVisible, setIsVisible] = useState(!animateIn);
    const [isFlipped, setIsFlipped] = useState(!flipReveal);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        if (animateIn) {
            const timer = setTimeout(() => setIsVisible(true), animationDelay);
            return () => clearTimeout(timer);
        }
    }, [animateIn, animationDelay]);

    useEffect(() => {
        if (flipReveal) {
            const timer = setTimeout(() => setIsFlipped(true), animationDelay + 200);
            return () => clearTimeout(timer);
        }
    }, [flipReveal, animationDelay]);

    // Card sizes - Larger for better visibility
    const sizeClasses = large
        ? 'w-28 h-42'   // Larger community cards
        : 'w-20 h-30';  // Larger player cards

    // Get card image path
    const getCardImage = (card: CardType) => {
        const suitNames: Record<string, string> = {
            h: 'hearts',
            d: 'diamonds',
            c: 'clubs',
            s: 'spades'
        };

        const rankNames: Record<string, string> = {
            'A': 'ace',
            '2': '2',
            '3': '3',
            '4': '4',
            '5': '5',
            '6': '6',
            '7': '7',
            '8': '8',
            '9': '9',
            'T': '10',
            'J': 'jack',
            'Q': 'queen',
            'K': 'king'
        };

        const suit = suitNames[card.suit];
        const rank = rankNames[card.rank];
        return `/images/${rank}_of_${suit}.png`;
    };

    // Preload the card face image
    useEffect(() => {
        if (card && !hidden) {
            const img = new Image();
            img.src = getCardImage(card);
            img.onload = () => setImageLoaded(true);
        }
    }, [card, hidden]);

    // Determine which face to show
    const shouldShowFront = card && !hidden && (!flipReveal || (isFlipped && imageLoaded));
    const shouldShowBack = hidden || !card || !shouldShowFront;

    return (
        <div
            className={clsx(
                'relative transition-all duration-300',
                sizeClasses,
                animateIn && !isVisible && 'opacity-0 scale-75 translate-y-6',
                animateIn && isVisible && 'opacity-100 scale-100 translate-y-0',
                className
            )}
            style={{ transitionDelay: `${animationDelay}ms` }}
        >
            {/* Card Back - In normal flow to provide sizing */}
            <div
                className={clsx(
                    'rounded-lg flex items-center justify-center shadow-lg overflow-hidden bg-blue-700 transition-opacity duration-500',
                    sizeClasses,
                    shouldShowBack ? 'opacity-100' : 'opacity-0'
                )}
            >
                <img
                    src="/images/back.png"
                    alt="Card back"
                    className="w-full h-full object-cover"
                    loading="eager"
                />
            </div>

            {/* Card Front */}
            {card && (
                <div
                    className={clsx(
                        'absolute inset-0 rounded-lg shadow-lg select-none overflow-hidden bg-white p-1 transition-opacity duration-500',
                        shouldShowFront ? 'opacity-100' : 'opacity-0'
                    )}
                >
                    <img
                        src={getCardImage(card)}
                        alt={`${card.rank} of ${SUIT_MAP[card.suit]}`}
                        className="w-full h-full object-contain"
                        loading="eager"
                    />
                </div>
            )}
        </div>
    );
}
