import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PokerGame } from '../game/PokerGame';
import { Player, BotDifficulty } from '../game/types';
import { BotLogic } from '../game/BotLogic';
import { TournamentManager } from '../game/TournamentManager';
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
    const [botAutoTop, setBotAutoTop] = useState(true);
    const [, setTick] = useState(0);

    // Session tracking
    const sessionId = useRef<string>(`sess_${Date.now()}`);
    const sessionStartTime = useRef<string>(new Date().toISOString());

    const mode = searchParams.get('mode') as 'cash' | 'tournament' || 'cash';
    const tableType = (searchParams.get('difficulty') as TableType) || 'mixed';
    
    // Tournament State
    const tournamentRef = useRef<TournamentManager | null>(null);
    const [tournamentInfo, setTournamentInfo] = useState<any>(null);

    const createGame = useCallback(() => {
        const availableDifficulties: BotDifficulty[] = ['beginner', 'intermediate', 'advanced', 'pro'];
        const mixedDifficulties: BotDifficulty[] = Array.from({ length: 5 }, () => {
            const randIndex = Math.floor(Math.random() * availableDifficulties.length);
            return availableDifficulties[randIndex];
        });

        const getDifficulty = (index: number): BotDifficulty => {
            if (tableType === 'mixed') {
                return mixedDifficulties[index];
            }
            return tableType as BotDifficulty;
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

        if (mode === 'tournament') {
            const config = {
                startingChips: 3000,
                playersCount: 50,
                handsPerLevel: 10,
                buyIn: 100
            };
            const tm = new TournamentManager(hero, config, tableType);
            tournamentRef.current = tm;
            setTournamentInfo({ ...tm.state });
            return tm.getHeroTable() || new PokerGame([hero]);
        }

        return new PokerGame([hero, ...bots]);
    }, [tableType, mode, user?.name]);

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
            let sessionData = {
                id: sessionId.current,
                userId: user.id,
                date: sessionStartTime.current,
                handsPlayed: hero.stats.handsPlayed,
                chipsWon: hero.chips - hero.totalBuyIn,
                difficulty: tableType,
                mode: mode
            };

            if (mode === 'tournament' && tournamentRef.current) {
                const tm = tournamentRef.current;
                let placement = tm.state.heroPlacement;
                let prize = tm.state.heroPrize;
                
                // If they give up while alive
                if (!placement) {
                    placement = tm.state.playersRemaining;
                    prize = tm.state.payouts[placement - 1] || 0;
                }

                sessionData.buyInAmount = tm.config.buyIn;
                sessionData.prizeWon = prize;
                sessionData.placement = placement;
                sessionData.totalPlayers = tm.config.playersCount;
                sessionData.chipsWon = prize - tm.config.buyIn; // In tournaments, chipsWon represents actual profit/loss
            }

            StorageService.saveSession(sessionData);
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
            if (mode === 'tournament' && tournamentRef.current) {
                // If the table is game over in tournament, advance the tournament
                tournamentRef.current.advanceTournament();
                setTournamentInfo({ ...tournamentRef.current.state });
                const nextTable = tournamentRef.current.getHeroTable();
                
                if (!tournamentRef.current.state.isActive) {
                    game.state.isGameOver = true; // Tournament over
                    setTick(t => t + 1);
                    return;
                } else if (nextTable) {
                    // Hero moved tables or table continued
                    nextTable.startNewHand();
                    setGame(nextTable);
                    setCountdown(AUTO_NEXT_HAND_DELAY);
                    setTick(t => t + 1);
                    setTimeout(() => SoundManager.playDeal(), 100);
                    return;
                }
            } else {
                game.state.isGameOver = true;
                setTick(t => t + 1);
                return;
            }
        }

        if (mode === 'tournament' && tournamentRef.current) {
            tournamentRef.current.advanceTournament();
            setTournamentInfo({ ...tournamentRef.current.state });
            const nextTable = tournamentRef.current.getHeroTable();
            if (nextTable && nextTable !== game) {
                // Rebalanced
                setGame(nextTable);
                nextTable.startNewHand();
                setCountdown(AUTO_NEXT_HAND_DELAY);
                setTick(t => t + 1);
                setTimeout(() => SoundManager.playDeal(), 100);
                return;
            }
        }

        if (mode === 'cash' && botAutoTop) {
            game.state.players.forEach(p => {
                if (!p.isHuman && p.chips < INITIAL_CHIPS) {
                    game.buyIn(p.id, INITIAL_CHIPS);
                }
            });
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
                    <span className="text-xs font-bold px-2 py-1 bg-gray-700 rounded text-gray-300 uppercase">{mode} • {tableType}</span>
                    
                    {mode === 'cash' && (
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-300 ml-4 cursor-pointer select-none hover:text-white transition-colors">
                            <input 
                                type="checkbox" 
                                checked={botAutoTop} 
                                onChange={(e) => setBotAutoTop(e.target.checked)} 
                                className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-poker-gold focus:ring-poker-gold focus:ring-offset-gray-900"
                            />
                            Bot AutoTop
                        </label>
                    )}
                </div>

                <div className="flex gap-6 text-sm items-center">
                    {mode === 'tournament' && tournamentInfo && (
                        <div className="flex gap-4 text-xs font-bold bg-gray-900 px-4 py-2 rounded border border-gray-700 text-purple-400">
                            <div>Lvl: <span className="text-white">{tournamentInfo.currentLevel}</span></div>
                            <div>Players: <span className="text-white">{tournamentInfo.playersRemaining}</span></div>
                            <div>Avg: <span className="text-white">{tournamentInfo.averageStack}</span></div>
                        </div>
                    )}
                    <div className="text-gray-400">Blinds: <span className="text-white">${game.state.smallBlindAmount}/${game.state.bigBlindAmount}</span></div>
                    <div className="text-gray-400">Pot: <span className="text-poker-gold font-bold text-lg">${game.state.pot}</span></div>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="flex-1 flex items-center justify-center relative bg-black/20 p-4">
                <PokerTable
                    gameState={game.state}
                    onBuyIn={mode === 'cash' ? (playerId) => {
                        game.buyIn(playerId, INITIAL_CHIPS);
                        setTick(t => t + 1);
                        SoundManager.playChip();
                    } : undefined}
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
