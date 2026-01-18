import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/StorageService';

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const sessions = StorageService.getSessions(user?.id);

    const totalHands = sessions.reduce((acc, s) => acc + s.handsPlayed, 0);
    const totalProfit = sessions.reduce((acc, s) => acc + s.chipsWon, 0);
    const lastSession = sessions[sessions.length - 1];

    const startGame = (difficulty: string) => {
        navigate(`/play?difficulty=${difficulty}`);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
            {/* Top Bar */}
            <div className="flex justify-between items-center p-6 bg-gray-800 shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-bold">{user?.name}</div>
                        <div className="text-xs text-poker-gold uppercase tracking-wider">{user?.isPro ? 'Pro Member' : 'Free Tier'}</div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/import')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition flex items-center gap-2"
                    >
                        <span>📥</span> Import Hands
                    </button>
                    <button
                        onClick={logout}
                        className="text-gray-400 hover:text-white transition"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold text-white mb-4">Ready to grind?</h1>
                        <p className="text-xl text-gray-400">Select a table difficulty to start your session.</p>
                    </div>

                    {/* Game Modes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        <button onClick={() => startGame('beginner')} className="group p-8 bg-gray-800 hover:bg-green-900/30 border border-gray-700 hover:border-green-500 rounded-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🌱</div>
                            <h3 className="text-2xl font-bold text-green-400 mb-2">Beginner</h3>
                            <p className="text-center text-gray-400">Passive bots. Perfect for learning the basics.</p>
                        </button>

                        <button onClick={() => startGame('intermediate')} className="group p-8 bg-gray-800 hover:bg-blue-900/30 border border-gray-700 hover:border-blue-500 rounded-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
                            <h3 className="text-2xl font-bold text-blue-400 mb-2">Intermediate</h3>
                            <p className="text-center text-gray-400">Tight-Aggressive. A solid standard challenge.</p>
                        </button>

                        <button onClick={() => startGame('advanced')} className="group p-8 bg-gray-800 hover:bg-red-900/30 border border-gray-700 hover:border-red-500 rounded-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🦈</div>
                            <h3 className="text-2xl font-bold text-red-500 mb-2">Pro</h3>
                            <p className="text-center text-gray-400">GTO concepts & tricky plays. Bring your A-game.</p>
                        </button>

                        <button onClick={() => startGame('mixed')} className="group p-8 bg-gray-800 hover:bg-purple-900/30 border border-gray-700 hover:border-purple-500 rounded-2xl transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎲</div>
                            <h3 className="text-2xl font-bold text-purple-400 mb-2">Mixed</h3>
                            <p className="text-center text-gray-400">Random mix of all skill levels.</p>
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                            <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Hands</h4>
                            <div className="text-3xl font-bold text-white">{totalHands}</div>
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                            <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Profit</h4>
                            <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {totalProfit >= 0 ? '+' : ''}{totalProfit} BB
                            </div>
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                            <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Last Session</h4>
                            {lastSession ? (
                                <div>
                                    <div className="text-xl font-bold text-white">{new Date(lastSession.date).toLocaleDateString()}</div>
                                    <div className="text-sm text-gray-400">{lastSession.handsPlayed} hands, {lastSession.chipsWon} BB</div>
                                </div>
                            ) : (
                                <div className="text-xl text-gray-500">No sessions yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
