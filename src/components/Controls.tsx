import { useState, useEffect } from 'react';

interface ControlsProps {
    onFold: () => void;
    onCall: () => void;
    onCheck: () => void;
    onRaise: (amount: number) => void;
    canCheck: boolean;
    callAmount: number;
    minRaise: number;
    maxRaise: number; // All-in amount
    userChips: number;
    pot: number;
    bigBlindAmount: number;
    phase?: 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';
    onNextHand?: () => void;
    isPlayerTurn: boolean;
    countdown?: number;
}

export function Controls({
    onFold,
    onCall,
    onCheck,
    onRaise,
    canCheck,
    callAmount,
    minRaise,
    maxRaise,
    userChips,
    pot,
    bigBlindAmount,
    phase,
    onNextHand,
    isPlayerTurn,
    countdown
}: ControlsProps) {
    const [raiseAmount, setRaiseAmount] = useState(minRaise);
    const [showSlider, setShowSlider] = useState(false);

    // Reset slider state when turn ends
    useEffect(() => {
        if (!isPlayerTurn) {
            setShowSlider(false);
        }
    }, [isPlayerTurn]);

    // Update raise amount if min raise changes while slider is open
    // Ensure raise amount is within valid bounds (min/max)
    useEffect(() => {
        if (showSlider) {
            console.log('Controls debug:', { minRaise, maxRaise, raiseAmount });
            const effectiveMin = Math.min(minRaise, maxRaise);
            let newAmount = raiseAmount;

            if (newAmount < effectiveMin) newAmount = effectiveMin;
            if (newAmount > maxRaise) newAmount = maxRaise;

            if (newAmount !== raiseAmount) {
                console.log('Adjusting raise amount:', { from: raiseAmount, to: newAmount });
                setRaiseAmount(newAmount);
            }
        }
    }, [minRaise, maxRaise, showSlider]); // Removed raiseAmount from deps to avoid fighting UI updates

    // Calculate bet sizing buttons
    // For pot bets: raise = callAmount + (pot + callAmount) * fraction
    // Note: pot passed in props now includes all current bets on table (effective pot)
    // Wait, standard Pot Raise calculation:
    // Pot Raise = Call Amount + (Pot + Call Amount)
    // Since 'pot' passed from App includes 'callAmount' (because it includes all bets), we might be double counting?
    // App passes: pot = state.pot + sum(currentBets)
    // If Hero faces a bet of 8. 'pot' includes that 8.
    // 'callAmount' is 8.
    // Pot Raise = 8 + (Pot (including 8? or excluding?))
    // Standard rule: Pot Size Raise amount = Total Pot including all bets + Amount to Call.
    // If App passed 'pot' includes the bet of 8.
    // Then Pot = Pot_Center + 8.
    // Amount to call = 8.
    // Pot Raise = 8 + (Pot_Center + 8 + 8) = Pot_Center + 24?
    // Let's stick to the current formula but ensure checks.

    // Pot excluding hero's current bet? Hero's current bet is in 'pot' (sum(currentBet)).
    // Ideally we want Pot = Center + Villains' Bets.
    // Hero's bet should be considered? Usually "Pot" means everything in middle.
    // Let's use the prop 'pot' as "Total chips in middle".

    // We need to valid raise >= minRaise.

    const potAfterCall = pot + callAmount;
    const threeXBB = Math.max(minRaise, bigBlindAmount * 3);
    const halfPot = Math.max(minRaise, callAmount + Math.floor(potAfterCall * 0.5));
    const threeFourthsPot = Math.max(minRaise, callAmount + Math.floor(potAfterCall * 0.75));
    const fullPot = Math.max(minRaise, callAmount + potAfterCall);
    const allIn = maxRaise;

    useEffect(() => {
        if (showSlider) {
            console.log('--- Quick Bet Calc Debug ---');
            console.log('minRaise:', minRaise);
            console.log('bigBlindAmount:', bigBlindAmount);
            console.log('threeXBB (max(minRaise, 3*BB)):', threeXBB);
            console.log('3*BB raw:', bigBlindAmount * 3);
        }
    }, [showSlider, minRaise, bigBlindAmount, threeXBB]);

    const handleRaiseClick = () => {
        if (showSlider) {
            onRaise(raiseAmount);
            setShowSlider(false);
        } else {
            // Reset to min raise when opening slider
            const effectiveMin = Math.min(minRaise, allIn);
            setRaiseAmount(effectiveMin);
            setShowSlider(true);
        }
    };

    const handleQuickBet = (amount: number) => {
        const finalAmount = Math.min(amount, allIn);
        onRaise(finalAmount);
        setShowSlider(false);
    };

    // Showdown phase - show Next Hand button
    if (phase === 'showdown') {
        return (
            <div className="flex gap-4 p-4 bg-gray-900 border-t-2 border-poker-gold/50 w-full justify-center h-[120px] items-center">
                <button
                    onClick={onNextHand}
                    className="px-8 py-3 rounded-full bg-green-600 hover:bg-green-500 text-white font-bold text-lg shadow-lg transition animate-pulse"
                >
                    Next Hand {countdown !== undefined && countdown > 0 ? `(${countdown}s)` : ''}
                </button>
            </div>
        );
    }

    // Not player's turn - disable controls
    if (!isPlayerTurn) {
        return (
            <div className="flex gap-4 p-4 bg-gray-900 border-t-2 border-poker-gold/50 w-full justify-center items-center h-[120px]">
                <div className="text-gray-400 text-lg font-medium">Waiting for other players...</div>
            </div>
        );
    }

    return (
        <div className="relative p-4 bg-gray-900 border-t-2 border-poker-gold/50 w-full h-[120px] flex flex-col justify-center">
            {/* Bet Sizing Slider (Pop-up) */}
            {showSlider && (
                <div className="absolute bottom-full left-0 w-full bg-gray-900/95 backdrop-blur-sm border-t-2 border-poker-gold/50 p-6 pb-20 shadow-2xl z-50 flex flex-col gap-4 animate-in slide-in-from-bottom-10 fade-in duration-200">
                    <div className="max-w-4xl mx-auto w-full">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 font-medium">Raise Amount</span>
                            <span className="text-3xl font-bold text-poker-gold">${raiseAmount}</span>
                        </div>

                        {/* Slider */}
                        <div className="mb-6 px-2">
                            <input
                                type="range"
                                min={Math.min(minRaise, allIn)}
                                max={allIn}
                                step={1}
                                value={raiseAmount}
                                onChange={(e) => setRaiseAmount(Number(e.target.value))}
                                className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-poker-gold hover:accent-yellow-400 transition-colors"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                                <span>MIN: ${minRaise}</span>
                                <span>ALL-IN: ${allIn}</span>
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-5 gap-3 mb-6">
                            <button onClick={() => handleQuickBet(threeXBB)} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold transition border border-gray-700 flex flex-col items-center justify-center">
                                <span>3BB</span>
                                <span className="text-xs text-gray-400">${threeXBB}</span>
                            </button>
                            <button onClick={() => handleQuickBet(halfPot)} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold transition border border-gray-700 flex flex-col items-center justify-center">
                                <span>1/2 Pot</span>
                                <span className="text-xs text-gray-400">${halfPot}</span>
                            </button>
                            <button onClick={() => handleQuickBet(threeFourthsPot)} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold transition border border-gray-700 flex flex-col items-center justify-center">
                                <span>3/4 Pot</span>
                                <span className="text-xs text-gray-400">${threeFourthsPot}</span>
                            </button>
                            <button onClick={() => handleQuickBet(fullPot)} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold transition border border-gray-700 flex flex-col items-center justify-center">
                                <span>Pot</span>
                                <span className="text-xs text-gray-400">${fullPot}</span>
                            </button>
                            <button onClick={() => handleQuickBet(allIn)} className="p-3 bg-red-900/50 hover:bg-red-600 border border-red-800 text-red-100 rounded-lg text-sm font-bold transition flex flex-col items-center justify-center">
                                <span>All-In</span>
                                <span className="text-xs text-red-300 font-mono">${allIn}</span>
                            </button>
                        </div>

                        {/* Confirm / Cancel Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowSlider(false)}
                                className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onRaise(raiseAmount);
                                    setShowSlider(false);
                                }}
                                className="flex-[2] py-4 bg-gradient-to-r from-poker-gold to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-extrabold text-xl rounded-xl shadow-lg transform active:scale-95 transition-all"
                            >
                                CONFIRM BET
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Action Buttons */}
            <div className="flex gap-3 justify-center">
                <button
                    onClick={onFold}
                    className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg transition min-w-[100px]"
                >
                    Fold
                </button>

                {canCheck ? (
                    <button
                        onClick={onCheck}
                        className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg transition min-w-[100px]"
                    >
                        Check
                    </button>
                ) : (
                    <button
                        onClick={onCall}
                        disabled={userChips <= 0}
                        className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg transition min-w-[100px] disabled:opacity-50"
                    >
                        Call ${Math.min(callAmount, userChips)}
                    </button>
                )}

                <button
                    onClick={handleRaiseClick}
                    disabled={userChips <= callAmount}
                    className={`px-6 py-3 rounded-full font-bold shadow-lg transition min-w-[120px] ${showSlider
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-poker-gold hover:bg-yellow-400 text-black'
                        } disabled:opacity-50`}
                >
                    {showSlider
                        ? `${callAmount > 0 ? 'Raise' : 'Bet'} $${raiseAmount}`
                        : callAmount > 0 ? 'Raise' : 'Bet'}
                </button>
            </div>

            {/* Info Bar */}
            <div className="flex justify-center gap-6 mt-3 text-sm text-gray-400">
                <span>Your chips: <span className="text-white font-bold">${userChips}</span></span>
                <span>Pot: <span className="text-poker-gold font-bold">${pot}</span></span>
                {callAmount > 0 && <span>To call: <span className="text-blue-400 font-bold">${callAmount}</span></span>}
            </div>
        </div>
    );
}
