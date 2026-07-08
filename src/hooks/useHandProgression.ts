import { useState, useEffect } from 'react';
import { PokerGame } from '../game/PokerGame';
import { SoundManager } from '../utils/SoundManager';

interface UseHandProgressionProps {
    game: PokerGame | null;
    autoNextHandDelay: number;
    onNextHand: () => void;
}

export function useHandProgression({ game, autoNextHandDelay, onNextHand }: UseHandProgressionProps) {
    const [showShowdown, setShowShowdown] = useState(false);
    const [countdown, setCountdown] = useState(autoNextHandDelay);

    useEffect(() => {
        if (!game) return;

        if (game.state.phase === 'showdown' && game.state.winnerInfo && !showShowdown) {
            setShowShowdown(true);
            setCountdown(autoNextHandDelay);
            SoundManager.playWin();
        }
    }, [game, game?.state.phase, game?.state.winnerInfo, showShowdown, autoNextHandDelay]);

    useEffect(() => {
        if (!showShowdown || !game) return;
        if (game.state.isGameOver) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            onNextHand();
        }
    }, [countdown, showShowdown, game, onNextHand]);

    return {
        showShowdown,
        setShowShowdown,
        countdown,
        setCountdown
    };
}
