import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        await login(email);
        navigate('/');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-900 to-gray-900"></div>

            <div className="z-10 w-full max-w-md p-8 bg-gray-800/80 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-sm">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">♠️</div>
                    <h1 className="text-3xl font-bold text-poker-gold">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to track your progress</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                            Email / Username
                        </label>
                        <input
                            id="email"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter any username (demo)"
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !email}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Signing in...' : 'Enter App'}
                    </button>

                    <p className="text-xs text-center text-gray-500 mt-4">
                        Note: This is a local demo. No password needed.
                    </p>
                </form>
            </div>
        </div>
    );
};
