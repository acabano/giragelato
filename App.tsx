// FIX: Create the main App component to handle application logic and state.
import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import GameScreen from './components/GameScreen';
import BackendScreen from './components/BackendScreen';
import { User } from './types';
import * as userService from './services/userService';
import Spinner from './components/Spinner';
import { buildUrl } from './utils/paths';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGameActive, setIsGameActive] = useState(true);

    useEffect(() => {
        const init = async () => {
            // Load User
            const user = userService.getCurrentUser();
            if (user) {
                setCurrentUser(user);
            }

            // Load Config for Active State
            try {
                const timestamp = new Date().getTime();
                const response = await fetch(buildUrl(`data/config.json?t=${timestamp}`));
                if (response.ok) {
                    const config = await response.json();
                    // Default to true if undefined
                    setIsGameActive(config.active !== false);
                }
            } catch (error) {
                console.error("Failed to load config:", error);
            }

            setIsLoading(false);
        };
        init();
    }, []);

    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        userService.logout();
        setCurrentUser(null);
    };

    if (isLoading) {
        return <Spinner message="Loading..." />;
    }

    // Show overlay only if game is inactive AND user is logged in AND user is NOT admin
    const showOverlay = !isGameActive && currentUser && currentUser.role !== 'admin';

    return (
        <>
            {showOverlay && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    {/* Backdrop with grayscale effect */}
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-50 backdrop-grayscale backdrop-filter" style={{ backdropFilter: 'grayscale(100%)' }}></div>

                    {/* Message Box */}
                    <div className="relative z-10 bg-white p-10 rounded-2xl shadow-2xl text-center max-w-xl mx-4 border-4 border-gray-200 transform scale-110">
                        <div className="text-6xl mb-6 animate-bounce">🔧</div>
                        <h2 className="text-3xl font-extrabold text-gray-800 mb-4 uppercase tracking-wider">Stiamo oliando la ruota</h2>
                        <p className="text-xl text-gray-600 font-medium mb-6">Il gioco sarà disponibile prossimamente</p>

                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}

            <div className={`min-h-screen ${showOverlay ? 'filter grayscale blur-sm pointer-events-none overflow-hidden h-screen' : ''}`}>
                {currentUser ? (
                    currentUser.role === 'admin' ? (
                        <BackendScreen onLogout={handleLogout} />
                    ) : (
                        <GameScreen user={currentUser} onLogout={handleLogout} />
                    )
                ) : (
                    <LoginScreen onLoginSuccess={handleLoginSuccess} />
                )}
            </div>
        </>
    );
};

export default App;
