import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const { login, register, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!username || !password) {
            setErrorMsg('Username and password required');
            return;
        }

        try {
            if (isRegistering) {
                await register(username, password);
            } else {
                await login(username, password);
            }
            navigate('/');
        } catch (err: any) {
            setErrorMsg(err.message || 'Authentication failed');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-900 to-gray-900"></div>

            <div className="z-10 w-full max-w-md p-8 bg-gray-800/80 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-sm">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">♠️</div>
                    <h1 className="text-3xl font-bold text-poker-gold">
                        {isRegistering ? 'Create Profile' : 'Welcome Back'}
                    </h1>
                    <p className="text-gray-400">
                        {isRegistering ? 'Register to track your stats locally' : 'Sign in to access your stats'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                        />
                    </div>

                    {errorMsg && (
                        <div className="text-red-400 text-sm text-center font-bold">
                            {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !username || !password}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : (isRegistering ? 'Register & Enter' : 'Login')}
                    </button>

                    <p className="text-sm text-center text-gray-400 mt-4">
                        {isRegistering ? 'Already have a profile?' : "Don't have a profile yet?"}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setErrorMsg('');
                            }}
                            className="text-blue-400 hover:text-blue-300 font-bold transition"
                        >
                            {isRegistering ? 'Sign In' : 'Register'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};
