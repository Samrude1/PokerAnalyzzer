import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PokerGame } from '../game/PokerGame';
import { Player, BotDifficulty } from '../game/types';
import { TournamentManager } from '../game/TournamentManager';
import { OpponentProfiler } from '../game/OpponentProfiler';
import { PokerTable } from '../components/PokerTable';
import { Controls } from '../components/Controls';
import { ShowdownOverlay } from '../components/ShowdownOverlay';
import { GameOverScreen } from '../components/GameOverScreen';
import { FinalTableAnnouncement } from '../components/FinalTableAnnouncement';
import { SessionDashboard } from '../components/SessionDashboard';
import { SoundManager } from '../utils/SoundManager';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/StorageService';
import { useBotTurn } from '../hooks/useBotTurn';
import { useHandProgression } from '../hooks/useHandProgression';

const INITIAL_CHIPS = 200;
const AUTO_NEXT_HAND_DELAY = 5;

type TableType = BotDifficulty | 'mixed';

export const GamePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Game State
    const [game, setGame] = useState<PokerGame | null>(null);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showFinalTableAnnouncement, setShowFinalTableAnnouncement] = useState(false);
    const [hasSeenFinalTable, setHasSeenFinalTable] = useState(false);
    const [botAutoTop, setBotAutoTop] = useState(true);
    const [, setTick] = useState(0);
    const [accumulatedHands, setAccumulatedHands] = useState<any[]>([]);

    const triggerTick = useCallback(() => setTick(t => t + 1), []);
    const handleNextHandRef = useRef<() => void>(() => {});

    const { showShowdown, setShowShowdown, countdown, setCountdown } = useHandProgression({
        game,
        autoNextHandDelay: AUTO_NEXT_HAND_DELAY,
        onNextHand: () => handleNextHandRef.current()
    });

    useBotTurn({ game, onTick: triggerTick });

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
                stats: OpponentProfiler.initializeStats()
            };
        });

        const hero: Player = {
            id: 'p1',
            name: user?.username || 'Hero',
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
            stats: OpponentProfiler.initializeStats()
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
    }, [tableType, mode, user?.username]);

    // Initialize Game
    useEffect(() => {
        const newGame = createGame();
        newGame.startNewHand();
        setGame(newGame);
        SoundManager.playClick();
        
        if (mode === 'tournament' && tournamentRef.current?.tables.length === 1) {
            // Started as a single table tournament (e.g. 9 players or fewer)
            setHasSeenFinalTable(true);
        }

        // Cleanup function to save session when unmounting
        return () => {
            // We can't easily access the *latest* game state here in cleanup due to closure staleness
            // But we can try relying on a ref if we tracked stats in a ref
        };
    }, [createGame, mode]);

    const handleLeaveGame = async () => {
        if (!game) return;

        // Save Session
        const hero = game.state.players.find(p => p.isHuman);
        if (hero && user) {
            const sessionData: import('../services/StorageService').SavedSession = {
                id: sessionId.current,
                userId: user.id,
                date: sessionStartTime.current,
                handsPlayed: hero.stats.handsPlayed,
                chipsWon: hero.chips - hero.totalBuyIn,
                difficulty: tableType,
                mode: mode,
                vpipCount: hero.stats.vpipCount,
                pfrCount: hero.stats.pfrCount,
                threeBetCount: hero.stats.threeBetCount,
                threeBetOpportunity: hero.stats.threeBetOpportunity,
                aggressionsCount: hero.stats.aggressionsCount,
                callsCount: hero.stats.callsCount,
                sawFlopCount: hero.stats.sawFlopCount,
                wonWhenSawFlopCount: hero.stats.wonWhenSawFlopCount,
                cbetFlopOpp: hero.stats.cbetFlopOpp,
                cbetFlopCount: hero.stats.cbetFlopCount,
                cbetTurnOpp: hero.stats.cbetTurnOpp,
                cbetTurnCount: hero.stats.cbetTurnCount,
                cbetRiverOpp: hero.stats.cbetRiverOpp,
                cbetRiverCount: hero.stats.cbetRiverCount,
                stealOpp: hero.stats.stealOpp,
                stealCount: hero.stats.stealCount,
                foldToStealOpp: hero.stats.foldToStealOpp,
                foldToStealCount: hero.stats.foldToStealCount,
                foldToThreeBetOpp: hero.stats.foldToThreeBetOpp,
                foldToThreeBetCount: hero.stats.foldToThreeBetCount,
                showdownsReached: hero.stats.showdownsReached,
                showdownsWon: hero.stats.showdownsWon,
                positionalStats: hero.stats.positionalStats
            };

            if (mode === 'tournament' && tournamentRef.current) {
                const tm = tournamentRef.current;
                let placement = tm.state.heroPlacement;
                let prize = tm.state.heroPrize || 0;
                
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

            await StorageService.saveSession(sessionData);

            const allSessionHands = [...accumulatedHands, ...game.state.sessionHands];
            const savedHands: import('../services/StorageService').SavedHand[] = allSessionHands.map((h, index) => ({
                id: `${sessionData.id}_hand_${index}`,
                sessionId: sessionData.id,
                handNumber: h.handNumber,
                timestamp: new Date().toISOString(),
                heroPosition: h.heroPosition,
                heroCards: h.heroCards.map((c: any) => `${c.rank}${c.suit}`),
                boardCards: h.communityCards.map((c: any) => `${c.rank}${c.suit}`),
                potSize: h.finalPot,
                heroNetWon: h.heroNetWon,
                heroShowdownWon: h.heroShowdownWon,
                heroNonShowdownWon: h.heroNonShowdownWon,
                actionLog: h.actionLog
            }));
            if (savedHands.length > 0) {
                await StorageService.saveHands(savedHands);
            }
        }

        navigate('/');
    };

    // Hooks handle bot loop and hand progression countdown now

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

                if (tournamentRef.current.state.heroPlacement) {
                    game.state.isGameOver = true;
                    setTick(t => t + 1);
                    return;
                }

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

            if (tournamentRef.current.state.heroPlacement) {
                game.state.isGameOver = true;
                setTick(t => t + 1);
                return;
            }

            // Check if we just hit the final table
            if (tournamentRef.current.tables.length === 1 && !hasSeenFinalTable) {
                setHasSeenFinalTable(true);
                setShowFinalTableAnnouncement(true);
            }

            const nextTable = tournamentRef.current.getHeroTable();
            if (nextTable && nextTable !== game) {
                // Rebalanced
                setAccumulatedHands(prev => [...prev, ...game.state.sessionHands]);
                setGame(nextTable);
                nextTable.startNewHand();
                setTick(t => t + 1);
                setShowShowdown(false);
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
    handleNextHandRef.current = handleNextHand;

    if (!game) return <div className="text-white flex items-center justify-center h-screen">Loading Table...</div>;

    if (game.state.isGameOver) {
        let placement, prize;
        if (mode === 'tournament' && tournamentRef.current) {
            placement = tournamentRef.current.state.heroPlacement;
            prize = tournamentRef.current.state.heroPrize;
        }
        return <GameOverScreen 
            players={game.state.players} 
            onPlayAgain={handleLeaveGame}
            isTournament={mode === 'tournament'}
            tournamentPlacement={placement}
            tournamentPrize={prize}
        />;
    }

    const hero = game.state.players.find(p => p.isHuman);
    if (!hero) return null;

    const isPlayerTurn = game.state.activePlayerId === hero.id && hero.status === 'active';
    const callAmount = game.state.currentBet - hero.currentBet;
    const canCheck = callAmount <= 0;
    const isFinalTable = mode === 'tournament' && tournamentRef.current?.tables.length === 1;

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
            {showFinalTableAnnouncement && (
                <FinalTableAnnouncement onComplete={() => setShowFinalTableAnnouncement(false)} />
            )}

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
                    mode={mode}
                    isFinalTable={isFinalTable}
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
                    hero={hero} 
                    sessionHands={[...accumulatedHands, ...game.state.sessionHands]}
                    onClose={() => setShowDashboard(false)} 
                />
            )}
        </div>
    );
};
