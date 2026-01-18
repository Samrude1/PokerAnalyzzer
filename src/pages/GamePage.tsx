import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PokerGame } from '../game/PokerGame';
import { Player, BotDifficulty } from '../game/types';
import { BotLogic } from '../game/BotLogic';
import { PokerTable } from '../components/PokerTable';
import { Controls } from '../components/Controls';
import { ShowdownOverlay } from '../components/ShowdownOverlay';
import { GameOverScreen } from '../components/GameOverScreen';
import { SessionDashboard } from '../components/SessionDashboard';
import { SoundManager } from '../utils/SoundManager';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/StorageService';

const INITIAL_CHIPS = 200;
const AUTO_NEXT_HAND_DELAY = 5;

type TableType = BotDifficulty | 'mixed';

export const GamePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Game State
    const [game, setGame] = useState<PokerGame | null>(null);
    const [showShowdown, setShowShowdown] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [countdown, setCountdown] = useState(AUTO_NEXT_HAND_DELAY);
    const [, setTick] = useState(0);

    // Session tracking
    const sessionId = useRef<string>(`sess_${Date.now()}`);
    const sessionStartTime = useRef<string>(new Date().toISOString());

    const tableType = (searchParams.get('difficulty') as TableType) || 'mixed';

    const createGame = useCallback(() => {
        const getDifficulty = (index: number): BotDifficulty => {
            if (tableType === 'mixed') {
                if (index === 0) return 'beginner';      // 1 Fish
                if (index === 1) return 'intermediate';  // 1 Nit
                if (index === 2) return 'advanced';      // 1 TAG
                if (index === 3) return 'pro';           // 1 LAG
                return 'advanced';                       // Remainder TAG
            }
            return tableType;
        };

        const getBotName = (index: number, _diff: BotDifficulty): string => {
            return `Bot ${index + 1}`;
        };

        const bots: Player[] = Array.from({ length: 5 }, (_, i) => {
            const diff = getDifficulty(i);
            return {
                id: `p${i + 2}`,
                name: getBotName(i, diff),
                chips: INITIAL_CHIPS,
                initialChips: INITIAL_CHIPS,
                totalBuyIn: INITIAL_CHIPS,
                cards: [],
                status: 'active',
                currentBet: 0,
                role: 'none',
                isHuman: false,
                hasActed: false,
                handContribution: 0,
                difficulty: diff,
                stats: {
                    vpip: 0, pfr: 0, af: 0,
                    handsPlayed: 0, handsWon: 0,
                    vpipCount: 0, pfrCount: 0,
                    threeBetCount: 0, threeBetOpportunity: 0,
                    aggressionsCount: 0, callsCount: 0,
                    showdownsReached: 0, showdownsWon: 0,
                    sessionPnL: 0
                }
            };
        });

        const hero: Player = {
            id: 'p1',
            name: user?.name || 'Hero',
            chips: INITIAL_CHIPS,
            initialChips: INITIAL_CHIPS,
            totalBuyIn: INITIAL_CHIPS,
            cards: [],
            status: 'active',
            currentBet: 0,
            role: 'none',
            isHuman: true,
            hasActed: false,
            handContribution: 0,
            stats: {
                vpip: 0, pfr: 0, af: 0,
                handsPlayed: 0, handsWon: 0,
                vpipCount: 0, pfrCount: 0,
                threeBetCount: 0, threeBetOpportunity: 0,
                aggressionsCount: 0, callsCount: 0,
                showdownsReached: 0, showdownsWon: 0,
                sessionPnL: 0
            }
        };

        return new PokerGame([hero, ...bots]);
    }, [tableType, user?.name]);

    // Initialize Game
    useEffect(() => {
        const newGame = createGame();
        newGame.startNewHand();
        setGame(newGame);
        SoundManager.playClick();

        // Cleanup function to save session when unmounting
        return () => {
            // We can't easily access the *latest* game state here in cleanup due to closure staleness
            // But we can try relying on a ref if we tracked stats in a ref
        };
    }, [createGame]);

    const handleLeaveGame = () => {
        if (!game) return;

        // Save Session
        const hero = game.state.players.find(p => p.isHuman);
        if (hero && user) {
            StorageService.saveSession({
                id: sessionId.current,
                userId: user.id,
                date: sessionStartTime.current,
                handsPlayed: hero.stats.handsPlayed,
                chipsWon: hero.chips - hero.totalBuyIn,
                difficulty: tableType
            });
        }

        navigate('/');
    };

    // Bot Turn Loop
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
                setTick(t => t + 1);
            }, 800 + Math.random() * 700);

            return () => clearTimeout(timeoutId);
        }
    }, [game, game?.state.activePlayerId, game?.state.phase]);

    // Showdown detection
    useEffect(() => {
        if (!game) return;

        if (game.state.phase === 'showdown' && game.state.winnerInfo && !showShowdown) {
            setShowShowdown(true);
            setCountdown(AUTO_NEXT_HAND_DELAY);
            SoundManager.playWin();

            // Save Hand to LocalStorage (optional foundation for Phase 2)
            // We could call StorageService.saveHand(...) here
        }
    }, [game, game?.state.phase, game?.state.winnerInfo, showShowdown]);

    // Countdown timer
    useEffect(() => {
        if (!showShowdown || !game) return;
        if (game.state.isGameOver) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            handleNextHand();
        }
    }, [countdown, showShowdown, game]);

    const handleAction = (actionType: 'fold' | 'call' | 'check' | 'raise', amount?: number) => {
        if (!game) return;
        const hero = game.state.players.find(p => p.isHuman);
        if (!hero) return;

        if (actionType === 'fold') SoundManager.playFold();
        else if (actionType === 'check') SoundManager.playCheck();
        else if (actionType === 'call' || actionType === 'raise') SoundManager.playChip();

        const callCost = game.state.currentBet - hero.currentBet;
        if ((actionType === 'call' && hero.chips <= callCost) ||
            (actionType === 'raise' && amount && amount >= hero.chips + hero.currentBet)) {
            SoundManager.playAllIn();
        }

        game.handleAction(hero.id, actionType, amount);
        setTick(t => t + 1);
    };

    const handleNextHand = () => {
        if (!game) return;
        setShowShowdown(false);

        if (game.isGameOver()) {
            game.state.isGameOver = true;
            setTick(t => t + 1);
            return;
        }

        game.startNewHand();
        setCountdown(AUTO_NEXT_HAND_DELAY);
        setTick(t => t + 1);
        setTimeout(() => SoundManager.playDeal(), 100);
    };

    if (!game) return <div className="text-white flex items-center justify-center h-screen">Loading Table...</div>;

    if (game.state.isGameOver) {
        return <GameOverScreen players={game.state.players} onPlayAgain={handleLeaveGame} />;
    }

    const hero = game.state.players.find(p => p.isHuman);
    if (!hero) return null;

    const isPlayerTurn = game.state.activePlayerId === hero.id && hero.status === 'active';
    const callAmount = game.state.currentBet - hero.currentBet;
    const canCheck = callAmount <= 0;

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-gray-800 shadow-md z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to leave the table? Progress will be saved.')) {
                                handleLeaveGame();
                            }
                        }}
                        className="p-2 px-4 bg-gray-700 hover:bg-red-600 rounded-lg text-sm font-bold transition flex items-center gap-2"
                    >
                        <span>⬅</span> Lobby
                    </button>
                    <button
                        onClick={() => setShowDashboard(true)}
                        className="p-2 px-4 bg-gray-700 hover:bg-blue-600 rounded-lg text-sm font-bold transition flex items-center gap-2"
                    >
                        <span>📊</span> Stats
                    </button>
                    <div className="h-6 w-px bg-gray-600 mx-2"></div>
                    <span className="text-xs font-bold px-2 py-1 bg-gray-700 rounded text-gray-300 uppercase">{tableType}</span>
                </div>

                <div className="flex gap-6 text-sm items-center">
                    <div className="text-gray-400">Blinds: <span className="text-white">${game.state.smallBlindAmount}/${game.state.bigBlindAmount}</span></div>
                    <div className="text-gray-400">Pot: <span className="text-poker-gold font-bold text-lg">${game.state.pot}</span></div>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="flex-1 flex items-center justify-center relative bg-black/20 p-4">
                <PokerTable
                    gameState={game.state}
                    onBuyIn={(playerId) => {
                        game.buyIn(playerId, INITIAL_CHIPS);
                        setTick(t => t + 1);
                        SoundManager.playChip();
                    }}
                />
            </div>

            {/* Controls */}
            <Controls
                onFold={() => handleAction('fold')}
                onCall={() => handleAction('call')}
                onCheck={() => handleAction('check')}
                onRaise={(amt) => handleAction('raise', amt)}
                canCheck={canCheck}
                callAmount={Math.max(0, callAmount)}
                minRaise={game.state.minRaise}
                maxRaise={hero.chips + hero.currentBet}
                userChips={hero.chips}
                pot={game.state.pot + game.state.players.reduce((acc, p) => acc + p.currentBet, 0)}
                bigBlindAmount={game.state.bigBlindAmount}
                phase={game.state.phase}
                onNextHand={handleNextHand}
                isPlayerTurn={isPlayerTurn}
                countdown={showShowdown ? countdown : undefined}
            />

            {/* Showdown Overlay */}
            {showShowdown && game.state.winnerInfo && (
                <ShowdownOverlay
                    winnerInfo={game.state.winnerInfo}
                    players={game.state.players}
                />
            )}

            {/* Session Dashboard */}
            {showDashboard && (
                <SessionDashboard
                    sessionHands={game.state.sessionHands}
                    hero={hero}
                    onClose={() => setShowDashboard(false)}
                />
            )}
        </div>
    );
};
