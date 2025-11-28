import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameConfig, GameState, Prize, User, PlayLog } from '../types';
import { initAudio, playSpinTickSound, playWinSound, playLossSound } from '../services/soundService';
import { buildUrl } from '../utils/paths';
import Wheel from './Wheel';
import Spinner from './Spinner';
import ResultModal from './ResultModal';

interface GameScreenProps {
    user: User;
    onLogout: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ user, onLogout }) => {
    const [config, setConfig] = useState<GameConfig | null>(null);
    const [playLogs, setPlayLogs] = useState<PlayLog[]>([]);
    const [gameState, setGameState] = useState<GameState>({ dailyPlays: 0, dailyWins: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Loading configuration...');
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinResult, setSpinResult] = useState<{ prize: Prize; rotation: number } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [lastPlayTime, setLastPlayTime] = useState<{ date: string; time: string } | null>(null);
    const [winCode, setWinCode] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const spinSoundInterval = useRef<number | null>(null);

    // Change Password State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Hamburger Menu State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) return;

        try {
            // Load current users
            const timestamp = new Date().getTime();
            const response = await fetch(buildUrl(`api/get-users.php?t=${timestamp}`), {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (!response.ok) throw new Error('Failed to load users');

            const users: User[] = await response.json();

            // Find and update current user
            const userIndex = users.findIndex(u => u.user === user.user);
            if (userIndex === -1) throw new Error('User not found');

            users[userIndex].password = newPassword;

            // Save updated users
            const saveResponse = await fetch(buildUrl(`api/save-users.php`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(users, null, 4)
            });

            if (saveResponse.ok) {
                setPasswordMessage({ text: 'Password aggiornata con successo!', type: 'success' });
                setTimeout(() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setPasswordMessage(null);
                }, 2000);
            } else {
                throw new Error('Failed to save password');
            }
        } catch (error) {
            console.error(error);
            setPasswordMessage({ text: 'Errore durante l\'aggiornamento della password.', type: 'error' });
        }
    };


    const loadConfig = useCallback(async () => {
        try {
            const timestamp = new Date().getTime();
            const [configRes, playsRes] = await Promise.all([
                fetch(buildUrl(`data/config.json?t=${timestamp}`), {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }),
                fetch(buildUrl(`data/giocate.json?t=${timestamp}`), {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                })
            ]);
            if (!configRes.ok) throw new Error('Failed to load config.json');
            const configData: GameConfig = await configRes.json();
            const playsData: PlayLog[] = playsRes.ok ? await playsRes.json() : [];
            setConfig(configData);
            setPlayLogs(playsData);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setLoadingMessage('Error loading game configuration.');
        }
    }, []);

    const initializeGameState = useCallback((user: User, allPlays: PlayLog[]) => {
        const today = new Date().toISOString().split('T')[0];

        // User's daily plays from giocate.json
        const todaysUserPlays = allPlays.filter(play => play.user === user.user && play.data === today);

        // Global daily wins from play log
        const todaysGlobalWins = allPlays.filter(play => play.data === today && play.vincita).length;

        setGameState({
            dailyPlays: todaysUserPlays.length,
            dailyWins: todaysGlobalWins,
        });
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    // Check if background image exists
    useEffect(() => {
        const checkBackgroundImage = () => {
            const img = new Image();
            const bgPath = buildUrl(`Image/sfondo.png`);

            img.onload = () => {
                setBackgroundImage(bgPath);
            };
            img.onerror = () => {
                setBackgroundImage(null);
            };
            img.src = bgPath;
        };

        checkBackgroundImage();
    }, []);

    useEffect(() => {
        if (playLogs.length >= 0) {
            initializeGameState(user, playLogs);
        }
    }, [user, playLogs, initializeGameState]);

    const handleSpin = async () => {
        if (!config || isSpinning || gameState.dailyPlays >= config.numeroGiocate) {
            return;
        }
        initAudio();

        // Check GLOBAL daily wins instead of user-specific wins
        const canWin = gameState.dailyWins < config.numeroVinciteGiornaliere;
        const winningPrizes = config.premi.map((p, i) => ({ ...p, index: i })).filter(p => p.vincita);
        const losingPrizes = config.premi.map((p, i) => ({ ...p, index: i })).filter(p => !p.vincita);

        let chosenPrize;
        if (canWin && winningPrizes.length > 0) {
            // Use configured winning percentage (default 5%)
            const winChance = (config.winningPercentage ?? 5) / 100;
            if (Math.random() < winChance) {
                chosenPrize = winningPrizes[Math.floor(Math.random() * winningPrizes.length)];
            }
        }

        if (!chosenPrize) {
            chosenPrize = losingPrizes.length > 0
                ? losingPrizes[Math.floor(Math.random() * losingPrizes.length)]
                : config.premi.map((p, i) => ({ ...p, index: i }))[Math.floor(Math.random() * config.premi.length)];
        }

        // Log to global play log (giocate.json)
        const now = new Date();
        const playDate = now.toISOString().split('T')[0];
        const playTime = now.toTimeString().split(' ')[0];

        // Save timestamp for modal
        setLastPlayTime({ date: playDate, time: playTime });

        const newPlayLog: PlayLog = {
            user: user.user,
            data: playDate,
            ora: playTime,
            risultato: chosenPrize.premio,
            vincita: chosenPrize.vincita,
            ...(chosenPrize.vincita && { riscosso: false }) // Add riscosso field only for wins
        };

        // Generate unique win code if it's a win
        if (chosenPrize.vincita) {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            newPlayLog.winCode = code;
            setWinCode(code);
        } else {
            setWinCode(null);
        }

        const updatedPlayLogs = [...playLogs, newPlayLog];
        setPlayLogs(updatedPlayLogs);

        // Save to server
        try {
            await fetch(buildUrl(`api/save-plays.php`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPlayLogs, null, 4)
            });
        } catch (error) {
            console.error('Failed to save play log:', error);
        }

        setIsSpinning(true);
        if (spinSoundInterval.current) clearInterval(spinSoundInterval.current);
        spinSoundInterval.current = window.setInterval(playSpinTickSound, 120);

        const sliceAngle = 360 / config.numeroSpicchi;
        const targetAngle = (chosenPrize.index ?? 0) * sliceAngle + sliceAngle / 2;

        // Calculate target position (0 degrees is top)
        // We want the wheel to end up such that targetAngle is at the top.
        // So the rotation should be (360 - targetAngle) modulo 360.
        const baseTarget = (360 - targetAngle) % 360;

        // Current rotation
        const currentRotation = spinResult ? spinResult.rotation : 0;
        const currentMod = currentRotation % 360;

        // Calculate distance to target (positive)
        let distance = baseTarget - currentMod;
        if (distance < 0) distance += 360;

        // Add minimum spins (at least 5 full spins)
        const minSpins = 5;
        const spins = minSpins + Math.floor(Math.random() * 3);

        const finalRotation = currentRotation + distance + (spins * 360);

        setSpinResult({ prize: chosenPrize, rotation: finalRotation });
    };

    const onSpinFinish = () => {
        if (!isSpinning) return;
        if (spinSoundInterval.current) {
            clearInterval(spinSoundInterval.current);
            spinSoundInterval.current = null;
        }
        setIsSpinning(false);
        setShowModal(true);
        if (spinResult) {
            if (spinResult.prize.vincita) playWinSound();
            else playLossSound();
        }
    };

    if (isLoading || !config) {
        return <Spinner message={loadingMessage} />;
    }

    const playsRemaining = config.numeroGiocate - gameState.dailyPlays;

    // Determine background style
    const backgroundStyle = backgroundImage
        ? {
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        }
        : {
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
        };



    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white p-4 font-sans" style={backgroundStyle}>
            {/* Hamburger Menu */}
            <div className="absolute top-4 right-4 z-50" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors backdrop-blur-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden animate-fade-in-down">
                        <div className="px-4 py-3 border-b border-gray-700">
                            <p className="text-sm text-gray-400">Logged in as</p>
                            <p className="text-sm font-bold text-white truncate">{user.user}</p>
                        </div>
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                setShowPasswordModal(true);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Cambia Password
                        </button>
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                onLogout();
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors flex items-center gap-2 border-t border-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-white">Cambia Password</h2>
                        <form onSubmit={handleChangePassword}>
                            <div className="mb-4">
                                <label className="block text-gray-400 text-sm mb-1">Nuova Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    minLength={4}
                                />
                            </div>
                            {passwordMessage && (
                                <p className={`text-sm mb-4 ${passwordMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {passwordMessage.text}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setNewPassword('');
                                        setPasswordMessage(null);
                                    }}
                                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
                                >
                                    Salva
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    {config.nomeDellaRuota}
                </h1>

            </header>

            <main className="flex flex-col items-center justify-center w-full flex-grow px-2 md:px-4">
                <div className="relative w-full max-w-[90vw] md:max-w-xl aspect-square flex items-center justify-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" style={{ filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.5))' }}>
                        <svg width="50" height="70" viewBox="0 0 50 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M25 70C25 70 50 40 50 25C50 11.1929 38.8071 0 25 0C11.1929 0 0 11.1929 0 25C0 40 25 70 25 70Z" className="fill-red-500" />
                            <circle cx="25" cy="25" r="10" className="fill-white" />
                        </svg>
                    </div>
                    <Wheel config={config} isSpinning={isSpinning} targetRotation={spinResult?.rotation || 0} onSpinFinish={onSpinFinish} />
                </div>

                <button
                    onClick={handleSpin}
                    disabled={isSpinning || playsRemaining <= 0}
                    className="mt-12 px-10 py-4 text-2xl font-bold text-white bg-gradient-to-br from-purple-600 to-blue-500 rounded-full shadow-lg hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    {isSpinning ? 'Spinning...' : 'GIRA'}
                </button>
                <p className="mt-4 px-4 py-2 rounded-lg bg-black bg-opacity-60 text-white font-semibold shadow-lg">
                    {playsRemaining > 0 ? `${playsRemaining} ${playsRemaining === 1 ? 'play' : 'plays'} remaining today.` : 'Per oggi hai finito i colpi riprova domani !'}
                </p>
            </main>
            {showModal && spinResult && (
                <ResultModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    prize={spinResult.prize}
                    username={user.user}
                    date={lastPlayTime?.date}
                    time={lastPlayTime?.time}
                    winCode={winCode || undefined}
                />
            )}
        </div>
    );
};

export default GameScreen;
