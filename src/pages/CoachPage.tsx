import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CoachService } from '../services/CoachService';
import { StorageService } from '../services/StorageService';

interface Message {
    role: 'user' | 'coach';
    content: string;
}

export const CoachPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [messages, setMessages] = useState<Message[]>([
        { role: 'coach', content: 'Hello! I am your AI Poker Coach. I have analyzed your hands and sessions. You can ask me questions about your play, or use the quick actions below.' }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [contextSessionId, setContextSessionId] = useState<string>('global-all');
    const [analysisMode, setAnalysisMode] = useState<'global' | 'session'>('global');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (user) {
            StorageService.getSessions()
                .then(data => setSessions(data))
                .catch(console.error);
        }
    }, [user]);

    const handleSend = async (customMessage?: string, actionType = 'chat') => {
        const textToSend = customMessage || input;
        if (!textToSend.trim() || !user) return;

        if (!customMessage) setInput('');
        
        setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
        setIsThinking(true);
        
        let currentResponse = '';
        setMessages(prev => [...prev, { role: 'coach', content: '' }]);

        await CoachService.sendChatMessage(user.id, textToSend, actionType, contextSessionId, (chunk) => {
            currentResponse += chunk;
            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].content = currentResponse;
                return newMsgs;
            });
        });

        setIsThinking(false);
    };

    // Indexing removed

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700 flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition">
                        ⬅ Back
                    </button>
                    <h2 className="text-xl font-bold text-poker-gold">AI Coach</h2>
                </div>
                
                <div className="p-4 flex-1">
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Analysis Context</h3>
                        
                        <div className="flex gap-4 mb-3 text-sm text-gray-300">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="analysisMode"
                                    checked={analysisMode === 'global'} 
                                    onChange={() => {
                                        setAnalysisMode('global');
                                        setContextSessionId('global-all');
                                    }} 
                                    className="accent-poker-gold"
                                />
                                Global
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="analysisMode"
                                    checked={analysisMode === 'session'} 
                                    onChange={() => {
                                        setAnalysisMode('session');
                                        setContextSessionId(sessions.length > 0 ? sessions[sessions.length - 1].id : 'global-all');
                                    }} 
                                    className="accent-poker-gold"
                                />
                                Session
                            </label>
                        </div>

                        {analysisMode === 'global' ? (
                            <select 
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm focus:outline-none focus:border-poker-gold"
                                value={contextSessionId}
                                onChange={(e) => setContextSessionId(e.target.value)}
                            >
                                <option value="global-all">All History</option>
                                <option value="global-cash">Cash Games</option>
                                <option value="global-tournament">Tournaments</option>
                            </select>
                        ) : (
                            <select 
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm focus:outline-none focus:border-poker-gold"
                                value={contextSessionId}
                                onChange={(e) => setContextSessionId(e.target.value)}
                                disabled={sessions.length === 0}
                            >
                                {sessions.length === 0 && <option value="global-all">No sessions found</option>}
                                {[...sessions].reverse().map(s => (
                                    <option key={s.id} value={s.id}>
                                        {new Date(s.date).toLocaleString()} | {s.mode.toUpperCase()} ({s.chipsWon > 0 ? '+' : ''}{s.chipsWon})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => handleSend("Identify the biggest leaks in my game based on my recent sessions.", 'leakfinder')}
                            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition flex items-center gap-3"
                        >
                            <span>🔍</span> Leak Finder
                        </button>
                        <button 
                            onClick={() => handleSend("Review my most recent session. What went well and what didn't?", 'session_review')}
                            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition flex items-center gap-3"
                        >
                            <span>📈</span> Session Review
                        </button>
                        <button 
                            onClick={() => handleSend("How can I improve my play from the Blinds?", 'chat')}
                            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition flex items-center gap-3"
                        >
                            <span>♠️</span> Blind Defense
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Powered by OpenRouter</span>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-4 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200 border border-gray-700'}`}>
                                <div className="text-xs text-gray-400 mb-1">{msg.role === 'user' ? 'You' : 'AI Coach'}</div>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-gray-400 animate-pulse">
                                Coach is thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-700 bg-gray-800">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Ask the coach anything..."
                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-poker-gold transition"
                            disabled={isThinking}
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={isThinking || !input.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold transition"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
