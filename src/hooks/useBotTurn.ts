import { useEffect } from 'react';
import { PokerGame } from '../game/PokerGame';
import { BotLogic } from '../game/BotLogic';
import { SoundManager } from '../utils/SoundManager';

interface UseBotTurnProps {
    game: PokerGame | null;
    onTick: () => void;
}

export function useBotTurn({ game, onTick }: UseBotTurnProps) {
    useEffect(() => {
        if (!game) return;
        if (game.state.phase === 'showdown') return;
        if (game.state.isGameOver) return;

        const activePlayer = game.state.players.find(p => p.id === game.state.activePlayerId);

        if (activePlayer && !activePlayer.isHuman && activePlayer.status === 'active') {
            const timeoutId = setTimeout(() => {
                const decision = BotLogic.decide(game, activePlayer);

                if (decision.action === 'fold') SoundManager.playFold();
                else if (decision.action === 'check') SoundManager.playCheck();
                else if (decision.action === 'call' || decision.action === 'raise') SoundManager.playChip();

                game.handleAction(activePlayer.id, decision.action, decision.amount);
                onTick();
            }, 800 + Math.random() * 700);

            return () => clearTimeout(timeoutId);
        }
    }, [game, game?.state.activePlayerId, game?.state.phase, onTick]);
}
