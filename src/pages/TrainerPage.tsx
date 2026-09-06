import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NashPushFold, TrainingScenario, RangeMatrixCell } from '../game/NashPushFold';
import { OddsCalculator } from '../game/OddsCalculator';
import { Position } from '../game/types';

export const TrainerPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'pushfold' | 'matrix' | 'odds'>('pushfold');

    // --- Push / Fold Quiz State ---
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [scenario, setScenario] = useState<TrainingScenario>(() => NashPushFold.generateScenario('medium'));
    const [userChoice, setUserChoice] = useState<'PUSH' | 'FOLD' | null>(null);
    const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0, bestStreak: 0 });

    const handleAnswer = (choice: 'PUSH' | 'FOLD') => {
        if (userChoice !== null) return;
        setUserChoice(choice);
        const isCorrect = choice === scenario.correctAction;

        setStats(prev => {
            const nextStreak = isCorrect ? prev.streak + 1 : 0;
            return {
                total: prev.total + 1,
                correct: prev.correct + (isCorrect ? 1 : 0),
                streak: nextStreak,
                bestStreak: Math.max(prev.bestStreak, nextStreak)
            };
        });
    };

    const handleNextScenario = () => {
        setUserChoice(null);
        setScenario(NashPushFold.generateScenario(difficulty));
    };

    // --- 13x13 Range Matrix State ---
    const [matrixPosition, setMatrixPosition] = useState<Position>('BTN');
    const [selectedCell, setSelectedCell] = useState<RangeMatrixCell | null>(null);
    const matrix = React.useMemo(() => NashPushFold.getMatrix(), []);

    // --- Pot Odds Calculator Sandbox State ---
    const [calcPot, setCalcPot] = useState(150);
    const [calcCall, setCalcCall] = useState(50);
    const [calcOuts, setCalcOuts] = useState(9);
    const [calcStreet, setCalcStreet] = useState<'flop' | 'turn'>('flop');

    const calculatedPotOdds = OddsCalculator.calculatePotOdds(calcCall, calcPot);
    const calculatedEquity = OddsCalculator.calculateDrawEquity(calcOuts, calcStreet);
    const isCalcProfitable = calcCall === 0 || calculatedEquity >= calculatedPotOdds;

    const suitColor = (suit: string) => {
        if (suit === '♥' || suit === '♦') return 'text-red-500';
        return 'text-white';
    };

    const getMatrixCellColor = (cell: RangeMatrixCell) => {
        const depth = cell.maxBBByPosition[matrixPosition] || 0;
        if (depth >= 20) return 'bg-amber-500/80 text-black hover:bg-amber-400 font-extrabold';
        if (depth >= 12) return 'bg-emerald-600/80 text-white hover:bg-emerald-500 font-bold';
        if (depth >= 7) return 'bg-blue-600/80 text-white hover:bg-blue-500 font-semibold';
        if (depth >= 3) return 'bg-purple-700/60 text-purple-200 hover:bg-purple-600';
        if (depth > 0) return 'bg-gray-800 text-gray-400 hover:bg-gray-700 text-xs';
        return 'bg-gray-900/40 text-gray-600';
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-950 text-white">
            {/* Top Navigation */}
            <div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-bold transition flex items-center gap-2 border border-gray-700"
                    >
                        <span>⬅</span> Lobby
                    </button>
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                            <span>🎯</span> Poker Study Hub
                        </h1>
                        <p className="text-xs text-gray-400">Master short-stack Nash Push/Fold & Pot Odds math</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 bg-gray-800/80 p-1.5 rounded-xl border border-gray-700">
                    <button
                        onClick={() => setActiveTab('pushfold')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'pushfold' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        Push/Fold Quiz
                    </button>
                    <button
                        onClick={() => setActiveTab('matrix')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'matrix' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        13x13 Range Matrix
                    </button>
                    <button
                        onClick={() => setActiveTab('odds')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'odds' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        Pot Odds Sandbox
                    </button>
                </div>
            </div>

            {/* TAB 1: PUSH / FOLD TRAINER */}
            {activeTab === 'pushfold' && (
                <div className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
                    {/* Score Bar */}
                    <div className="grid grid-cols-4 gap-4 w-full mb-6">
                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Answered</div>
                            <div className="text-2xl font-black">{stats.total}</div>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Accuracy</div>
                            <div className="text-2xl font-black text-emerald-400">
                                {stats.total > 0 ? `${Math.round((stats.correct / stats.total) * 100)}%` : '0%'}
                            </div>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Streak</div>
                            <div className="text-2xl font-black text-amber-400">{stats.streak} 🔥</div>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center">
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Best Streak</div>
                            <div className="text-2xl font-black text-cyan-400">{stats.bestStreak}</div>
                        </div>
                    </div>

                    {/* Scenario Card */}
                    <div className="w-full bg-gradient-to-b from-gray-900 to-gray-900/90 border border-gray-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
                        <div className="flex justify-between items-center w-full mb-6">
                            <span className="px-4 py-1.5 bg-blue-950/80 border border-blue-800 text-blue-300 font-extrabold rounded-full text-sm">
                                Position: {scenario.position}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Difficulty:</span>
                                <select
                                    value={difficulty}
                                    onChange={(e) => {
                                        const d = e.target.value as 'easy' | 'medium' | 'hard';
                                        setDifficulty(d);
                                        setUserChoice(null);
                                        setScenario(NashPushFold.generateScenario(d));
                                    }}
                                    className="bg-gray-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 outline-none"
                                >
                                    <option value="easy">Easy (Obvious spots)</option>
                                    <option value="medium">Medium (Standard spots)</option>
                                    <option value="hard">Hard (Razor-thin decisions)</option>
                                </select>
                            </div>
                        </div>

                        {/* Stack Size Info */}
                        <div className="text-center mb-6">
                            <div className="text-sm uppercase tracking-widest text-gray-400 font-bold mb-1">Your Stack</div>
                            <div className="text-5xl font-black text-amber-400 font-mono">
                                {scenario.stackBB} <span className="text-2xl text-gray-400 font-normal">BB</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Blinds: {scenario.blinds.sb}/{scenario.blinds.bb} • Chips: ${scenario.stackBB * scenario.blinds.bb}</div>
                        </div>

                        {/* Cards Display */}
                        <div className="flex gap-4 mb-8">
                            {scenario.heroCards.map((c, idx) => (
                                <div
                                    key={idx}
                                    className="w-24 h-36 bg-gray-800 border-2 border-gray-700 rounded-2xl flex flex-col items-center justify-between p-3 shadow-xl transform hover:-translate-y-1 transition duration-200"
                                >
                                    <div className={`text-2xl font-black self-start ${suitColor(c.suit)}`}>
                                        {c.rank}
                                    </div>
                                    <div className={`text-5xl ${suitColor(c.suit)}`}>
                                        {c.suit}
                                    </div>
                                    <div className={`text-2xl font-black self-end ${suitColor(c.suit)}`}>
                                        {c.rank}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-sm font-semibold text-gray-300 mb-8 text-center max-w-md">
                            Action folds around to you in the <span className="text-blue-400 font-bold">{scenario.position}</span> with <span className="text-white font-mono font-bold">{scenario.handNotation}</span>. What is the mathematically correct Nash play?
                        </div>

                        {/* Action Buttons */}
                        {userChoice === null ? (
                            <div className="flex gap-6 w-full max-w-md">
                                <button
                                    onClick={() => handleAnswer('FOLD')}
                                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xl rounded-2xl shadow-lg transition active:scale-95"
                                >
                                    FOLD
                                </button>
                                <button
                                    onClick={() => handleAnswer('PUSH')}
                                    className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xl rounded-2xl shadow-lg transition active:scale-95"
                                >
                                    PUSH (ALL-IN)
                                </button>
                            </div>
                        ) : (
                            <div className="w-full max-w-lg flex flex-col items-center animate-fadeIn">
                                <div className={`w-full p-6 rounded-2xl border mb-6 text-center ${userChoice === scenario.correctAction
                                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                                    : 'bg-rose-950/70 border-rose-500 text-rose-200'
                                }`}>
                                    <div className="text-2xl font-black mb-2">
                                        {userChoice === scenario.correctAction ? '🎉 Correct Decision!' : '❌ Sub-Optimal Play!'}
                                    </div>
                                    <div className="text-sm mb-3">
                                        Correct Action: <span className="font-extrabold uppercase px-2.5 py-1 rounded bg-black/40 text-white tracking-wide">{scenario.correctAction}</span>
                                        {' '}• Profitable Push Limit: <span className="font-mono font-bold text-amber-300">{scenario.maxBB} BB</span>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed text-left border-t border-white/10 pt-3">
                                        {scenario.explanation}
                                    </p>
                                </div>

                                <button
                                    onClick={handleNextScenario}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                                >
                                    <span>Next Scenario</span> ➔
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: 13x13 RANGE MATRIX */}
            {activeTab === 'matrix' && (
                <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col items-center">
                    <div className="flex flex-wrap justify-between items-center w-full mb-6 gap-4">
                        <div>
                            <h2 className="text-xl font-bold">13x13 Push/Fold Range Matrix</h2>
                            <p className="text-xs text-gray-400">Shows maximum profitable stack depth (in Big Blinds) to shove unexploitative</p>
                        </div>

                        {/* Position Selector */}
                        <div className="flex items-center gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
                            {(['UTG', 'MP', 'CO', 'BTN', 'SB'] as Position[]).map(pos => (
                                <button
                                    key={pos}
                                    onClick={() => setMatrixPosition(pos)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${matrixPosition === pos ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {pos}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Legend */}
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-400 mb-4 items-center">
                        <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-amber-500"></span> 20+ BB (Monsters)</div>
                        <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-600"></span> 12 - 20 BB (Deep Push)</div>
                        <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-blue-600"></span> 7 - 12 BB (Standard Push)</div>
                        <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-purple-700"></span> 3 - 7 BB (Short-stack Push)</div>
                        <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-gray-800"></span> &lt; 3 BB (Desperation / Fold)</div>
                    </div>

                    {/* Matrix Grid */}
                    <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 shadow-2xl overflow-auto max-w-full">
                        <div className="grid grid-cols-13 gap-1 w-[680px]">
                            {matrix.map((row, rIdx) => (
                                row.map((cell, cIdx) => {
                                    const depth = cell.maxBBByPosition[matrixPosition] || 0;
                                    const isSelected = selectedCell?.name === cell.name;
                                    return (
                                        <button
                                            key={`${rIdx}-${cIdx}`}
                                            onClick={() => setSelectedCell(cell)}
                                            className={`h-11 rounded flex flex-col items-center justify-center transition border ${isSelected ? 'border-white scale-105 shadow-lg z-10' : 'border-transparent'} ${getMatrixCellColor(cell)}`}
                                        >
                                            <span className="text-[11px] leading-tight">{cell.name}</span>
                                            <span className="text-[9px] opacity-80 leading-none">{depth > 0 ? `${depth}bb` : '-'}</span>
                                        </button>
                                    );
                                })
                            ))}
                        </div>
                    </div>

                    {/* Cell Detail Card */}
                    {selectedCell && (
                        <div className="mt-6 w-full max-w-md bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-center animate-fadeIn">
                            <div>
                                <div className="text-xl font-bold text-white flex items-center gap-2">
                                    <span>{selectedCell.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 capitalize">{selectedCell.type}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Profitable push threshold from <span className="text-blue-400 font-bold">{matrixPosition}</span>:{' '}
                                    <span className="text-amber-400 font-bold font-mono text-sm">{selectedCell.maxBBByPosition[matrixPosition] || 0} BB</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCell(null)}
                                className="text-gray-500 hover:text-white text-sm"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: POT ODDS SANDBOX */}
            {activeTab === 'odds' && (
                <div className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col items-center">
                    <div className="w-full mb-6">
                        <h2 className="text-xl font-bold">Interactive Pot Odds & Outs Sandbox</h2>
                        <p className="text-xs text-gray-400">Calculate required pot odds, draw equity, and check mathematical expected value (+EV/-EV)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                        {/* Inputs Panel */}
                        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-6">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">
                                    Pot Size Before Your Call ($): {calcPot}
                                </label>
                                <input
                                    type="range"
                                    min="20"
                                    max="1000"
                                    step="10"
                                    value={calcPot}
                                    onChange={(e) => setCalcPot(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">
                                    Amount to Call ($): {calcCall}
                                </label>
                                <input
                                    type="range"
                                    min="5"
                                    max={calcPot * 2}
                                    step="5"
                                    value={calcCall}
                                    onChange={(e) => setCalcCall(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">
                                    Drawing Outs Count: {calcOuts} outs
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="15"
                                    value={calcOuts}
                                    onChange={(e) => setCalcOuts(Number(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                                    <span>Gutshot (4)</span>
                                    <span>OESD (8)</span>
                                    <span>Flush (9)</span>
                                    <span>Monster Draw (12-15)</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">
                                    Street:
                                </label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setCalcStreet('flop')}
                                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${calcStreet === 'flop' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                                    >
                                        Flop (2 cards to come • Rule of 4)
                                    </button>
                                    <button
                                        onClick={() => setCalcStreet('turn')}
                                        className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${calcStreet === 'turn' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                                    >
                                        Turn (1 card to come • Rule of 2)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Analysis & Results Panel */}
                        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 border-b border-gray-800 pb-3">
                                    Mathematical Breakdown
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Required Pot Odds:</span>
                                        <span className="text-2xl font-black text-amber-400 font-mono">{calculatedPotOdds}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Draw Win Equity:</span>
                                        <span className="text-2xl font-black text-cyan-400 font-mono">{calculatedEquity}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Total Pot After Call:</span>
                                        <span className="text-lg font-bold text-white font-mono">${calcPot + calcCall}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Verdict Banner */}
                            <div className={`p-4 rounded-xl border mt-6 text-center ${isCalcProfitable ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200' : 'bg-rose-950/70 border-rose-500 text-rose-200'}`}>
                                <div className="text-lg font-black mb-1">
                                    {isCalcProfitable ? '✅ +EV CALL RECOMMENDED' : '⚠️ -EV UNPROFITABLE CALL'}
                                </div>
                                <p className="text-xs opacity-90">
                                    {isCalcProfitable
                                        ? `Your draw equity (${calculatedEquity}%) is greater than the required pot odds (${calculatedPotOdds}%). Making this call is profitable in the long run!`
                                        : `Pot odds (${calculatedPotOdds}%) exceed your draw equity (${calculatedEquity}%). You will lose chips over time unless implied odds compensate.`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
