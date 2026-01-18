import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HandHistoryParser, ParseResult } from '../utils/HandHistoryParser';
import { StorageService, SavedSession } from '../services/StorageService';
import { useAuth } from '../context/AuthContext';

export const ImportPage: React.FC = () => {
    const [text, setText] = useState('');
    const [heroName, setHeroName] = useState('Hero');
    const [result, setResult] = useState<ParseResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleImport = () => {
        if (!text) return;
        setIsProcessing(true);

        // Use setTimeout to allow UI to render "Processing" state
        setTimeout(() => {
            const parseResult = HandHistoryParser.parsePokerStars(text, heroName);
            setResult(parseResult);
            setIsProcessing(false);
        }, 100);
    };

    const handleSave = () => {
        if (!result || !user) return;

        // Create a summary session
        const session: SavedSession = {
            id: result.hands[0]?.sessionId || `imp_${Date.now()}`,
            userId: user.id,
            date: new Date().toISOString(),
            handsPlayed: result.summary.totalHands,
            chipsWon: result.summary.totalProfit,
            difficulty: 'Imported'
        };

        StorageService.saveSession(session);
        StorageService.saveHands(result.hands);

        navigate('/');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-gray-800 shadow-md">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 px-4 bg-gray-700 hover:bg-red-600 rounded-lg text-sm font-bold transition flex items-center gap-2"
                    >
                        <span>⬅</span> Back
                    </button>
                    <h1 className="text-xl font-bold text-poker-gold">Import Hand History</h1>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Hero Name (as it appears in the history)
                            </label>
                            <input
                                type="text"
                                value={heroName}
                                onChange={(e) => setHeroName(e.target.value)}
                                className="w-full md:w-1/2 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Upload Hand History Files (.txt)
                            </label>
                            <input
                                type="file"
                                accept=".txt"
                                multiple
                                onChange={(e) => {
                                    const files = e.target.files;
                                    if (files && files.length > 0) {
                                        const file = files[0];
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const content = event.target?.result as string;
                                            setText(content);
                                        };
                                        reader.readAsText(file);
                                    }
                                }}
                                className="block w-full text-sm text-gray-400
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-blue-600 file:text-white
                                  hover:file:bg-blue-500
                                  cursor-pointer bg-gray-900 border border-gray-600 rounded-lg"
                            />
                        </div>

                        <div className="mb-6 relative">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Or Paste Text
                            </label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="PokerStars Hand #222..."
                                className="w-full h-48 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-xs font-mono text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>

                        {result ? (
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600 mb-6">
                                <h3 className="font-bold text-lg mb-2">Import Summary</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Hands:</span>
                                        <span className="font-bold text-white">{result.summary.totalHands}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total Profit:</span>
                                        <span className={`font-bold ${result.summary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${result.summary.totalProfit.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Parsing Errors:</span>
                                        <span className={`font-bold ${result.errors.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            {result.errors.length}
                                        </span>
                                    </div>
                                </div>
                                {result.errors.length > 0 && (
                                    <div className="mt-4 p-2 bg-red-900/20 text-red-300 text-xs rounded h-32 overflow-auto">
                                        {result.errors.map((e, i) => <div key={i}>{e}</div>)}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        <div className="flex gap-4">
                            {!result && (
                                <button
                                    onClick={handleImport}
                                    disabled={!text || isProcessing}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isProcessing ? 'Parsing...' : 'Analyze Text'}
                                </button>
                            )}

                            {result && (
                                <>
                                    <button
                                        onClick={() => setResult(null)}
                                        className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-all"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg transition-all"
                                    >
                                        Save & View Stats
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
