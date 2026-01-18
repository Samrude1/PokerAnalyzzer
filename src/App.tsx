import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { ImportPage } from './pages/ImportPage';

function PrivateRoute({ children }: { children: JSX.Element }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    return user ? children : <Navigate to="/login" replace />;
}

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={
                    <PrivateRoute>
                        <HomePage />
                    </PrivateRoute>
                } />
                <Route path="/play" element={
                    <PrivateRoute>
                        <GamePage />
                    </PrivateRoute>
                } />
                <Route path="/import" element={
                    <PrivateRoute>
                        <ImportPage />
                    </PrivateRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;
