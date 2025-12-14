import { useEffect, useState, useCallback } from 'react';
import { PokerGame } from './game/PokerGame';
import { Player, BotDifficulty } from './game/types';
import { BotLogic } from './game/BotLogic';
import { PokerTable } from './components/PokerTable';
import { Controls } from './components/Controls';
import { ShowdownOverlay } from './components/ShowdownOverlay';
import { GameOverScreen } from './components/GameOverScreen';
import { SessionDashboard } from './components/SessionDashboard';
import { SoundManager } from './utils/SoundManager';

const INITIAL_CHIPS = 200;
const AUTO_NEXT_HAND_DELAY = 5; // seconds

type TableType = BotDifficulty | 'mixed';

function App() {
    const [game, setGame] = useState<PokerGame | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [showShowdown, setShowShowdown] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [countdown, setCountdown] = useState(AUTO_NEXT_HAND_DELAY);
    const [, setTick] = useState(0);

    const createGame = useCallback((tableType: TableType) => {
        const getDifficulty = (index: number): BotDifficulty => {
            if (tableType === 'mixed') {
                // Mix: 1 Beginner, 2 Intermediate, 2 Advanced
                if (index === 0) return 'beginner';
                if (index <= 2) return 'intermediate';
                return 'advanced';
            }
            return tableType;
        };

        const getBotName = (index: number, _diff: BotDifficulty): string => {
            const num = index + 1;
            return `Bot ${num}`;
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
                stats: { handsPlayed: 0, handsWon: 0, vpipCount: 0, pfrCount: 0, threeBetCount: 0, threeBetOpportunity: 0, betsCount: 0, raisesCount: 0, callsCount: 0, showdownsReached: 0, showdownsWon: 0, sessionPnL: 0 }
            };
        });

        const hero: Player = {
            id: 'p1',
            name: 'Hero',
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
            stats: { handsPlayed: 0, handsWon: 0, vpipCount: 0, pfrCount: 0, threeBetCount: 0, threeBetOpportunity: 0, betsCount: 0, raisesCount: 0, callsCount: 0, showdownsReached: 0, showdownsWon: 0, sessionPnL: 0 }
        };

        return new PokerGame([hero, ...bots]);
    }, []);

    const startGame = (tableType: TableType) => {
        const newGame = createGame(tableType);
        newGame.startNewHand();
        setGame(newGame);
        setGameStarted(true);
        setShowShowdown(false);
        SoundManager.playClick();
    };

    const handlePlayAgain = () => {
        setGameStarted(false);
        setGame(null);
        setShowShowdown(false);
    };

    // Bot Turn Loop
    useEffect(() => {
        if (!game || !gameStarted) return;
        if (game.state.phase === 'showdown') return;
        if (game.state.isGameOver) return;

        const activePlayer = game.state.players.find(p => p.id === game.state.activePlayerId);

        if (activePlayer && !activePlayer.isHuman && activePlayer.status === 'active') {
            const timeoutId = setTimeout(() => {
                const decision = BotLogic.decide(game, activePlayer);

                // Play sound based on action
                if (decision.action === 'fold') SoundManager.playFold();
                else if (decision.action === 'check') SoundManager.playCheck();
                else if (decision.action === 'call' || decision.action === 'raise') SoundManager.playChip();

                game.handleAction(activePlayer.id, decision.action, decision.amount);
                setTick(t => t + 1);
            }, 800 + Math.random() * 700); // 0.8-1.5s thinking time

            return () => clearTimeout(timeoutId);
        }
    }, [game, game?.state.activePlayerId, game?.state.phase, gameStarted]);

    // Showdown detection and auto-progression
    useEffect(() => {
        if (!game || !gameStarted) return;

        if (game.state.phase === 'showdown' && game.state.winnerInfo && !showShowdown) {
            setShowShowdown(true);
            setCountdown(AUTO_NEXT_HAND_DELAY);
            SoundManager.playWin();
        }
    }, [game, game?.state.phase, game?.state.winnerInfo, gameStarted, showShowdown]);

    // Countdown timer for auto next hand
    useEffect(() => {
        if (!showShowdown || !game) return;
        if (game.state.isGameOver) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Auto-start next hand
            handleNextHand();
        }
    }, [countdown, showShowdown, game]);

    const handleAction = (actionType: 'fold' | 'call' | 'check' | 'raise', amount?: number) => {
        if (!game) return;
        const hero = game.state.players.find(p => p.isHuman);
        if (!hero) return;

        // Play sound based on action
        if (actionType === 'fold') SoundManager.playFold();
        else if (actionType === 'check') SoundManager.playCheck();
        else if (actionType === 'call' || actionType === 'raise') SoundManager.playChip();

        // Check for all-in
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

        // Check if game should end
        if (game.isGameOver()) {
            game.state.isGameOver = true;
            setTick(t => t + 1);
            return;
        }

        game.startNewHand();
        setCountdown(AUTO_NEXT_HAND_DELAY);
        setTick(t => t + 1);

        // Deal sound for new hand
        setTimeout(() => SoundManager.playDeal(), 100);
    };

    // Start screen
    if (!gameStarted) {
        return (
            <div className="flex flex-col h-screen bg-gray-900 text-white items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-gray-900 to-gray-900"></div>
                <div className="z-10 text-center max-w-4xl w-full px-4">
                    <div className="text-6xl mb-4">♠️♥️♣️♦️</div>
                    <h1 className="text-5xl font-bold text-poker-gold mb-2 drop-shadow-lg">Texas Hold'em</h1>
                    <p className="text-xl text-gray-300 mb-8">No-Limit 6-Max</p>

                    <h2 className="text-2xl text-white/80 mb-6 font-light">Select Table Difficulty</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={() => startGame('beginner')}
                            className="group p-6 bg-gray-800/80 hover:bg-green-900/40 border border-gray-700 hover:border-green-500 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl flex flex-col items-center"
                        >
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🌱</div>
                            <h3 className="text-xl font-bold text-green-400 mb-2">Beginner</h3>
                            <p className="text-sm text-gray-400">Passive bots. Good for learning the basics.</p>
                        </button>

                        <button
                            onClick={() => startGame('intermediate')}
                            className="group p-6 bg-gray-800/80 hover:bg-blue-900/40 border border-gray-700 hover:border-blue-500 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl flex flex-col items-center"
                        >
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎓</div>
                            <h3 className="text-xl font-bold text-blue-400 mb-2">Intermediate</h3>
                            <p className="text-sm text-gray-400">Tight-Aggressive. A solid challenge.</p>
                        </button>

                        <button
                            onClick={() => startGame('advanced')}
                            className="group p-6 bg-gray-800/80 hover:bg-red-900/40 border border-gray-700 hover:border-red-500 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl flex flex-col items-center"
                        >
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🦈</div>
                            <h3 className="text-xl font-bold text-red-500 mb-2">Pro</h3>
                            <p className="text-sm text-gray-400">Aggressive & Tricky. Use your best strategy.</p>
                        </button>

                        <button
                            onClick={() => startGame('mixed')}
                            className="group p-6 bg-gray-800/80 hover:bg-purple-900/40 border border-gray-700 hover:border-purple-500 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl flex flex-col items-center"
                        >
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎲</div>
                            <h3 className="text-xl font-bold text-purple-400 mb-2">Mixed</h3>
                            <p className="text-sm text-gray-400">Random mix of all skill levels.</p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!game) return <div className="text-white">Loading...</div>;

    // Game over screen
    if (game.state.isGameOver) {
        return <GameOverScreen players={game.state.players} onPlayAgain={handlePlayAgain} />;
    }

    const hero = game.state.players.find(p => p.isHuman);
    if (!hero) return <div className="text-white">Error: Hero not found.</div>;

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
                            if (confirm('Are you sure you want to leave the table?')) {
                                handlePlayAgain();
                            }
                        }}
                        className="p-2 px-4 bg-gray-700 hover:bg-red-600 rounded-lg text-sm font-bold transition flex items-center gap-2"
                        title="Return to Menu"
                    >
                        <span>⬅</span> Menu
                    </button>
                    <button
                        onClick={() => setShowDashboard(true)}
                        className="p-2 px-4 bg-gray-700 hover:bg-blue-600 rounded-lg text-sm font-bold transition flex items-center gap-2"
                        title="View Session Stats"
                    >
                        <span>📊</span> Stats
                    </button>
                    <div className="h-6 w-px bg-gray-600 mx-2"></div>
                    <h1 className="text-xl font-bold text-poker-gold">♠ 6-Max NL Hold'em</h1>
                    <span className="text-sm text-gray-400">Hand #{game.state.handNumber}</span>
                    <span className="text-xs px-2 py-1 bg-blue-600/30 rounded-full text-blue-300 uppercase tracking-wider">
                        {game.state.phase === 'pre-flop' ? 'Pre-Flop' :
                            game.state.phase === 'flop' ? 'Flop' :
                                game.state.phase === 'turn' ? 'Turn' :
                                    game.state.phase === 'river' ? 'River' : 'Showdown'}
                    </span>
                </div>
                <div className="flex gap-6 text-sm items-center">
                    <div className="text-gray-400">Blinds: <span className="text-white">${game.state.smallBlindAmount}/${game.state.bigBlindAmount}</span></div>
                    <div className="text-gray-400">Pot: <span className="text-poker-gold font-bold text-lg">${game.state.pot}</span></div>
                    {game.state.phase !== 'showdown' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-poker-gold/20 rounded-full border border-poker-gold/30">
                            <div className="w-2 h-2 bg-poker-gold rounded-full animate-pulse" />
                            <span className="text-poker-gold font-bold text-sm">
                                {game.state.players.find(p => p.id === game.state.activePlayerId)?.name || 'Unknown'}'s Turn
                            </span>
                        </div>
                    )}
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

            {/* Showdown Overlay - Compact Banner */}
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
}

export default App;
