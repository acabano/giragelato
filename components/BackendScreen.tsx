import React, { useState, useEffect } from 'react';
import { GameConfig, Prize, User, PlayLog, UserRequest } from '../types';
import emailjs from '@emailjs/browser';
import { buildUrl } from '../utils/paths';

interface BackendScreenProps {
    onLogout: () => void;
}

const BackendScreen: React.FC<BackendScreenProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<'config' | 'users' | 'logs' | 'requests'>('config');
    const [config, setConfig] = useState<GameConfig | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [playLogs, setPlayLogs] = useState<PlayLog[]>([]);
    const [requests, setRequests] = useState<UserRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // EmailJS Configuration
    const EMAILJS_SERVICE_ID = 'service_yhqh5ki';
    const EMAILJS_TEMPLATE_ID = 'template_qlut1jm';
    const EMAILJS_PUBLIC_KEY = 'k8cGZ3qhshqqt20NA';

    // Default configurations for corrupted files
    const getDefaultConfig = (): GameConfig => ({
        nomeDellaRuota: 'Gira Gelato',
        numeroSpicchi: 8,
        tema: 'Gelato',
        numeroVinciteGiornaliere: 1,
        numeroGiocate: 1,
        premi: [
            { premio: 'Cono Gelato', vincita: true, valore: 100 },
            { premio: 'Foglia Secca', vincita: false, valore: 0 },
            { premio: 'Panna Montata', vincita: true, valore: 50 },
            { premio: 'Cono Rotto', vincita: false, valore: 0 },
            { premio: 'Pinguinatura', vincita: true, valore: 200 },
            { premio: 'Sasso Comune', vincita: false, valore: 0 },
            { premio: 'Bisquit', vincita: true, valore: 150 },
            { premio: 'Pigna', vincita: false, valore: 0 }
        ],
        active: true,
        adminEmail: '',
        winningPercentage: 5,
        emailProvider: 'emailjs',
        emailJsConfig: {
            serviceId: 'service_yhqh5ki',
            templateId: 'template_qlut1jm',
            publicKey: 'k8cGZ3qhshqqt20NA'
        }
    });

    const getDefaultUsers = (): User[] => [
        { user: 'admin', password: 'admin', role: 'admin', history: [] }
    ];

    const getDefaultPlays = (): PlayLog[] => [];
    const getDefaultRequests = (): UserRequest[] => [];

    // Helper function to safely parse JSON with fallback
    const safeParseJSON = async <T,>(response: Response, defaultData: T, filename: string): Promise<T> => {
        try {
            if (!response.ok) {
                console.warn(`${filename} not found or error, using default`);
                return defaultData;
            }
            const text = await response.text();
            if (!text.trim()) {
                console.warn(`${filename} is empty, using default`);
                return defaultData;
            }
            const parsed = JSON.parse(text);
            return parsed;
        } catch (error) {
            console.error(`Error parsing ${filename}:`, error);
            console.warn(`Using default data for ${filename}`);
            return defaultData;
        }
    };

    // Helper function to restore corrupted file
    const restoreFile = async (filename: string, defaultData: any) => {
        try {
            const endpoint = filename === 'config.json' ? 'save-config.php' :
                filename === 'users.json' ? 'save-users.php' :
                    filename === 'giocate.json' ? 'save-plays.php' :
                        'save-requests.php';

            const response = await fetch(buildUrl(`api/${endpoint}`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaultData, null, 4)
            });

            if (response.ok) {
                console.log(`${filename} restored with default data`);
                return true;
            } else {
                console.error(`Failed to restore ${filename}`);
                return false;
            }
        } catch (error) {
            console.error(`Error restoring ${filename}:`, error);
            return false;
        }
    };

    const downloadCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) {
            setMessage({ text: 'No data to export', type: 'error' });
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Add cache-busting parameter to ensure fresh data
            const cacheBuster = `?t=${Date.now()}`;
            const [configRes, usersRes, playsRes, requestsRes] = await Promise.all([
                fetch(buildUrl(`data/config.json${cacheBuster}`), {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                }),
                fetch(buildUrl(`api/get-users.php${cacheBuster}`), {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                }),
                fetch(buildUrl(`data/giocate.json${cacheBuster}`), {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                }),
                fetch(buildUrl(`data/richieste.json${cacheBuster}`), {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                })
            ]);

            // Parse JSON with error handling and fallback to defaults
            const [configData, usersData, playsData, requestsData] = await Promise.all([
                safeParseJSON(configRes, getDefaultConfig(), 'config.json'),
                safeParseJSON(usersRes, getDefaultUsers(), 'users.json'),
                safeParseJSON(playsRes, getDefaultPlays(), 'giocate.json'),
                safeParseJSON(requestsRes, getDefaultRequests(), 'richieste.json')
            ]);

            // Validate config structure
            let validConfig = configData;
            if (!configData.nomeDellaRuota || !Array.isArray(configData.premi) || configData.premi.length === 0) {
                console.warn('Config structure invalid, using default');
                validConfig = getDefaultConfig();
                await restoreFile('config.json', validConfig);
            }

            // Validate users structure
            let validUsers = usersData;
            if (!Array.isArray(usersData) || usersData.length === 0) {
                console.warn('Users structure invalid, using default');
                validUsers = getDefaultUsers();
                await restoreFile('users.json', validUsers);
            }

            // Validate plays structure
            let validPlays = playsData;
            if (!Array.isArray(playsData)) {
                console.warn('Plays structure invalid, using default');
                validPlays = getDefaultPlays();
                await restoreFile('giocate.json', validPlays);
            }

            // Validate requests structure
            let validRequests = requestsData;
            if (!Array.isArray(requestsData)) {
                console.warn('Requests structure invalid, using default');
                validRequests = getDefaultRequests();
                await restoreFile('richieste.json', validRequests);
            }

            setConfig(validConfig);
            setUsers(validUsers);
            setPlayLogs(validPlays);
            setRequests(validRequests);
            setIsLoading(false);
        } catch (err) {
            console.error('Critical error loading data:', err);
            // Use defaults if everything fails
            const defaultConfig = getDefaultConfig();
            const defaultUsers = getDefaultUsers();
            setConfig(defaultConfig);
            setUsers(defaultUsers);
            setPlayLogs([]);
            setRequests([]);
            setMessage({
                text: 'Errore nel caricamento dei dati. File di configurazione ripristinati ai valori di default.',
                type: 'error'
            });
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveConfig = async () => {
        if (!config) return;
        try {
            const response = await fetch(`${import.meta.env.BASE_URL}api/save-config.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config, null, 4)
            });

            if (response.ok) {
                setMessage({ text: 'Configuration saved successfully!', type: 'success' });
                // Reload data from server to ensure we have the latest version
                await fetchData();
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Failed to save config');
            }
        } catch (error) {
            console.error(error);
            setMessage({ text: `Error saving configuration: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
        }
    };

    const handleSaveUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.BASE_URL}api/save-users.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(users, null, 4)
            });

            if (response.ok) {
                setMessage({ text: 'Users saved successfully!', type: 'success' });
                // Reload data from server to ensure we have the latest version
                await fetchData();
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Failed to save users');
            }
        } catch (error) {
            console.error(error);
            setMessage({ text: `Error saving users: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' });
        }
    };

    // --- Config Handlers ---
    const handlePrizeChange = (index: number, field: keyof Prize, value: any) => {
        if (!config) return;
        const newPrizes = [...config.premi];
        newPrizes[index] = { ...newPrizes[index], [field]: value };
        setConfig({ ...config, premi: newPrizes });
    };

    const addPrize = () => {
        if (!config) return;
        const newPrize: Prize = { premio: 'New Prize', vincita: false, valore: 0 };
        setConfig({ ...config, premi: [...config.premi, newPrize], numeroSpicchi: config.numeroSpicchi + 1 });
    };

    const removePrize = (index: number) => {
        if (!config) return;
        const newPrizes = config.premi.filter((_, i) => i !== index);
        setConfig({ ...config, premi: newPrizes, numeroSpicchi: config.numeroSpicchi - 1 });
    };

    // --- User Handlers ---
    const handleUserChange = (index: number, field: keyof User, value: any) => {
        const newUsers = [...users];
        newUsers[index] = { ...newUsers[index], [field]: value };
        setUsers(newUsers);
    };

    const addUser = () => {
        const newUser: User = { user: 'newuser', password: 'password', role: 'user', history: [] };
        setUsers([...users, newUser]);
    };

    const removeUser = (index: number) => {
        const newUsers = users.filter((_, i) => i !== index);
        setUsers(newUsers);
    };

    // --- Request Handlers ---
    const createUserFromRequest = async (requestIndex: number) => {
        const request = requests[requestIndex];
        const username = `${request.nome.toLowerCase()}${request.cognome.charAt(0).toLowerCase()}`;
        const password = Math.random().toString(36).slice(-8);

        // Create new user
        const newUser: User = {
            user: username,
            password: password,
            role: 'user',
            email: request.email, // Save email for password recovery
            history: []
        };

        // Add to users
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);

        // Mark request as created
        const updatedRequests = [...requests];
        updatedRequests[requestIndex] = { ...request, creato: true, username };
        setRequests(updatedRequests);

        // Save both
        try {
            await Promise.all([
                fetch(`${import.meta.env.BASE_URL}api/save-users.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedUsers, null, 4)
                }),
                fetch(`${import.meta.env.BASE_URL}api/save-requests.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedRequests, null, 4)
                })
            ]);

            // Send email
            if (config?.emailProvider === 'smtp' && config.smtpConfig) {
                // Send via SMTP API
                const emailResponse = await fetch(`${import.meta.env.BASE_URL}api/send-email.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        smtpConfig: config.smtpConfig,
                        to: request.email,
                        subject: `Welcome to ${config.nomeDellaRuota}!`,
                        body: `
                            <h1>Welcome ${request.nome}!</h1>
                            <p>Your account has been created.</p>
                            <p><strong>Username:</strong> ${username}</p>
                            <p><strong>Password:</strong> ${password}</p>
                            <p>Good luck!</p>
                        `
                    })
                });

                if (emailResponse.ok) {
                    setMessage({
                        text: `✅ User created! Username: ${username}, Password: ${password}. Email sent via SMTP to ${request.email}`,
                        type: 'success'
                    });
                } else {
                    throw new Error('SMTP Email failed');
                }

            } else {
                // Send via EmailJS (Fallback or Default)
                const serviceId = config?.emailJsConfig?.serviceId || EMAILJS_SERVICE_ID;
                const templateId = config?.emailJsConfig?.templateId || EMAILJS_TEMPLATE_ID;
                const publicKey = config?.emailJsConfig?.publicKey || EMAILJS_PUBLIC_KEY;

                await emailjs.send(
                    serviceId,
                    templateId,
                    {
                        to_email: request.email,
                        to_name: `${request.nome} ${request.cognome}`,
                        username: username,
                        password: password,
                        wheel_name: config?.nomeDellaRuota || 'Wheel of Fortune',
                        email: config?.adminEmail || 'noreply@example.com' // Used for Reply-To in the template
                    },
                    publicKey
                );
                setMessage({
                    text: `✅ User created! Username: ${username}, Password: ${password}. Email sent via EmailJS to ${request.email}`,
                    type: 'success'
                });
            }

            // Reload data from server to ensure we have the latest version
            await fetchData();
        } catch (error) {
            console.error(error);
            setMessage({
                text: `⚠️ User created! Username: ${username}, Password: ${password}. WARNING: Email couldn't be sent.`,
                type: 'success'
            });
        }
    };

    // --- Play Log Handlers ---
    const handleClaimPrize = async (logIndex: number) => {
        const updatedLogs = [...playLogs];
        updatedLogs[logIndex] = { ...updatedLogs[logIndex], riscosso: true };
        setPlayLogs(updatedLogs);

        try {
            const response = await fetch(`${import.meta.env.BASE_URL}api/save-plays.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLogs, null, 4)
            });
            if (response.ok) {
                setMessage({ text: 'Prize marked as claimed!', type: 'success' });
                // Reload data from server to ensure we have the latest version
                await fetchData();
            } else {
                throw new Error('Failed to save play log');
            }
        } catch (error) {
            console.error(error);
            setMessage({ text: 'Error updating prize status', type: 'error' });
        }
    };

    const handleDeletePlayLog = async (logIndex: number) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo record?')) {
            return;
        }

        const updatedLogs = playLogs.filter((_, index) => index !== logIndex);
        setPlayLogs(updatedLogs);

        try {
            const response = await fetch(`${import.meta.env.BASE_URL}api/save-plays.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLogs, null, 4)
            });
            if (response.ok) {
                setMessage({ text: 'Play log deleted successfully!', type: 'success' });
                // Reload data from server to ensure we have the latest version
                await fetchData();
            } else {
                throw new Error('Failed to delete play log');
            }
        } catch (error) {
            console.error(error);
            setMessage({ text: 'Error deleting play log', type: 'error' });
            // Reload to restore original data
            await fetchData();
        }
    };

    const handleDeleteRequest = async (requestIndex: number) => {
        if (!window.confirm('Sei sicuro di voler eliminare questa richiesta?')) {
            return;
        }

        const updatedRequests = requests.filter((_, index) => index !== requestIndex);
        setRequests(updatedRequests);

        try {
            const response = await fetch(`${import.meta.env.BASE_URL}api/save-requests.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRequests, null, 4)
            });
            if (response.ok) {
                setMessage({ text: 'Request deleted successfully!', type: 'success' });
                // Reload data from server to ensure we have the latest version
                await fetchData();
            } else {
                throw new Error('Failed to delete request');
            }
        } catch (error) {
            console.error(error);
            setMessage({ text: 'Error deleting request', type: 'error' });
            // Reload to restore original data
            await fetchData();
        }
    };

    if (isLoading) return <div className="text-white text-center mt-20">Loading backend...</div>;
    if (!config) return <div className="text-white text-center mt-20">Error loading data</div>;

    // Sort play logs by date and time (most recent first)
    const sortedPlayLogs = [...playLogs].sort((a, b) => {
        const dateCompare = b.data.localeCompare(a.data);
        if (dateCompare !== 0) return dateCompare;
        return b.ora.localeCompare(a.ora);
    }).filter(log => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            log.user.toLowerCase().includes(term) ||
            log.risultato.toLowerCase().includes(term) ||
            log.data.includes(term) ||
            (log.winCode && log.winCode.toLowerCase().includes(term))
        );
    });

    // Calculate pending counts for badges
    const unclaimedWinsCount = playLogs.filter(log => log.vincita && !log.riscosso).length;
    const pendingRequestsCount = requests.filter(r => !r.creato).length;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-purple-400">Backend Administration</h1>
                    <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Logout</button>
                </div>

                {message && (
                    <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} flex justify-between items-center`}>
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)} className="text-white font-bold">&times;</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex mb-6 border-b border-gray-700">
                    <button
                        className={`py-2 px-4 font-semibold ${activeTab === 'config' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('config')}
                    >
                        Game Configuration
                    </button>
                    <button
                        className={`py-2 px-4 font-semibold ${activeTab === 'users' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('users')}
                    >
                        User Management
                    </button>
                    <button
                        className={`py-2 px-4 font-semibold relative ${activeTab === 'logs' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        Play Logs
                        {unclaimedWinsCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                                {unclaimedWinsCount}
                            </span>
                        )}
                    </button>
                    <button
                        className={`py-2 px-4 font-semibold relative ${activeTab === 'requests' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Richieste
                        {pendingRequestsCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                                {pendingRequestsCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'config' ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <h2 className="text-xl font-semibold mb-4 text-blue-300">General Settings</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Wheel Name</label>
                                        <input
                                            type="text"
                                            value={config.nomeDellaRuota}
                                            onChange={e => setConfig({ ...config, nomeDellaRuota: e.target.value })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-700 p-2 rounded border border-gray-600">
                                        <input
                                            type="checkbox"
                                            id="gameActive"
                                            checked={config.active !== false}
                                            onChange={e => setConfig({ ...config, active: e.target.checked })}
                                            className="w-5 h-5 accent-green-500"
                                        />
                                        <label htmlFor="gameActive" className="text-white font-bold cursor-pointer">
                                            Game Active (Enable/Disable Game)
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Admin Email (for notifications)</label>
                                        <input
                                            type="email"
                                            value={config.adminEmail || ''}
                                            onChange={e => setConfig({ ...config, adminEmail: e.target.value })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                            placeholder="admin@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Theme</label>
                                        <input
                                            type="text"
                                            value={config.tema}
                                            onChange={e => setConfig({ ...config, tema: e.target.value })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Daily Wins (Global)</label>
                                            <input
                                                type="number"
                                                value={config.numeroVinciteGiornaliere}
                                                onChange={e => setConfig({ ...config, numeroVinciteGiornaliere: parseInt(e.target.value) })}
                                                className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Daily Plays (Per User)</label>
                                            <input
                                                type="number"
                                                value={config.numeroGiocate}
                                                onChange={e => setConfig({ ...config, numeroGiocate: parseInt(e.target.value) })}
                                                className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Winning Probability (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={config.winningPercentage ?? 5}
                                            onChange={e => setConfig({ ...config, winningPercentage: parseInt(e.target.value) })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Slices (Auto-calculated)</label>
                                        <input
                                            type="number"
                                            value={config.numeroSpicchi}
                                            readOnly
                                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 opacity-50 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="border-t border-gray-700 pt-4 mt-4">
                                    <h3 className="text-lg font-semibold text-purple-300 mb-3">Email Configuration</h3>

                                    <div className="mb-4">
                                        <label className="block text-sm text-gray-400 mb-1">Email Provider</label>
                                        <select
                                            value={config.emailProvider || 'emailjs'}
                                            onChange={e => setConfig({ ...config, emailProvider: e.target.value as 'emailjs' | 'smtp' })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                        >
                                            <option value="emailjs">EmailJS (Client-side)</option>
                                            <option value="smtp">SMTP (Server-side)</option>
                                        </select>
                                    </div>

                                    {config.emailProvider === 'emailjs' && (
                                        <div className="space-y-3 pl-4 border-l-2 border-purple-500">
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Service ID</label>
                                                <input
                                                    type="text"
                                                    value={config.emailJsConfig?.serviceId || ''}
                                                    onChange={e => setConfig({
                                                        ...config,
                                                        emailJsConfig: { ...config.emailJsConfig!, serviceId: e.target.value }
                                                    })}
                                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                                    placeholder="service_..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Template ID</label>
                                                <input
                                                    type="text"
                                                    value={config.emailJsConfig?.templateId || ''}
                                                    onChange={e => setConfig({
                                                        ...config,
                                                        emailJsConfig: { ...config.emailJsConfig!, templateId: e.target.value }
                                                    })}
                                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                                    placeholder="template_..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Public Key</label>
                                                <input
                                                    type="text"
                                                    value={config.emailJsConfig?.publicKey || ''}
                                                    onChange={e => setConfig({
                                                        ...config,
                                                        emailJsConfig: { ...config.emailJsConfig!, publicKey: e.target.value }
                                                    })}
                                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                                    placeholder="Public Key"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {config.emailProvider === 'smtp' && (
                                        <div className="space-y-3 pl-4 border-l-2 border-purple-500">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">SMTP Host</label>
                                                    <input
                                                        type="text"
                                                        value={config.smtpConfig?.host || ''}
                                                        onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig!, host: e.target.value } })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                                        placeholder="smtp.example.com"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Port</label>
                                                    <input
                                                        type="number"
                                                        value={config.smtpConfig?.port || 465}
                                                        onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig!, port: parseInt(e.target.value) } })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="smtpSecure"
                                                    checked={config.smtpConfig?.secure ?? true}
                                                    onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig!, secure: e.target.checked } })}
                                                    className="w-4 h-4 accent-purple-500"
                                                />
                                                <label htmlFor="smtpSecure" className="text-sm text-gray-300 cursor-pointer">
                                                    Use Secure Connection (SSL/TLS)
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">SMTP User</label>
                                                    <input
                                                        type="text"
                                                        value={config.smtpConfig?.user || ''}
                                                        onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig!, user: e.target.value } })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">SMTP Password</label>
                                                    <input
                                                        type="password"
                                                        value={config.smtpConfig?.pass || ''}
                                                        onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig!, pass: e.target.value } })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">From Name</label>
                                                    <input
                                                        type="text"
                                                        value={config.smtpConfig?.fromName || ''}
                                                        onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig!, fromName: e.target.value } })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">From Email</label>
                                                    <input
                                                        type="email"
                                                        value={config.smtpConfig?.fromEmail || ''}
                                                        onChange={e => setConfig({ ...config, smtpConfig: { ...config.smtpConfig!, fromEmail: e.target.value } })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded p-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-800 p-6 rounded-lg">
                                <h2 className="text-xl font-semibold mb-4 text-blue-300">Actions</h2>
                                <button
                                    onClick={handleSaveConfig}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors mb-4"
                                >
                                    Save Configuration
                                </button>
                                <p className="text-sm text-gray-400">
                                    Changes will be saved to <code>data/config.json</code>.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-blue-300">Prizes / Segments</h2>
                                <button onClick={addPrize} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">+ Add Prize</button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-gray-400 border-b border-gray-700">
                                            <th className="p-2">#</th>
                                            <th className="p-2">Name</th>
                                            <th className="p-2">Is Win?</th>
                                            <th className="p-2">Value</th>
                                            <th className="p-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {config.premi.map((prize, index) => (
                                            <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                                                <td className="p-2 text-gray-500">{index + 1}</td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={prize.premio}
                                                        onChange={e => handlePrizeChange(index, 'premio', e.target.value)}
                                                        className="bg-gray-700 border border-gray-600 rounded p-1 w-full"
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={prize.vincita}
                                                        onChange={e => handlePrizeChange(index, 'vincita', e.target.checked)}
                                                        className="w-5 h-5 accent-purple-500"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        value={prize.valore}
                                                        onChange={e => handlePrizeChange(index, 'valore', parseInt(e.target.value))}
                                                        className="bg-gray-700 border border-gray-600 rounded p-1 w-24"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <button
                                                        onClick={() => removePrize(index)}
                                                        className="text-red-400 hover:text-red-300"
                                                        title="Remove"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : activeTab === 'users' ? (
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-blue-300">Registered Users</h2>
                            <div className="space-x-2">
                                <button
                                    onClick={() => downloadCSV(users, 'users.csv')}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold"
                                >
                                    Export CSV
                                </button>
                                <button
                                    onClick={handleSaveUsers}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold"
                                >
                                    Save Users
                                </button>
                                <button onClick={addUser} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold">+ Add User</button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-700">
                                        <th className="p-2">Username</th>
                                        <th className="p-2">Password</th>
                                        <th className="p-2">Role</th>
                                        <th className="p-2">History Count</th>
                                        <th className="p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => (
                                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={user.user}
                                                    onChange={e => handleUserChange(index, 'user', e.target.value)}
                                                    className="bg-gray-700 border border-gray-600 rounded p-1 w-full"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={user.password || ''}
                                                    onChange={e => handleUserChange(index, 'password', e.target.value)}
                                                    className="bg-gray-700 border border-gray-600 rounded p-1 w-full"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <select
                                                    value={user.role || 'user'}
                                                    onChange={e => handleUserChange(index, 'role', e.target.value)}
                                                    className="bg-gray-700 border border-gray-600 rounded p-1 w-full"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="p-2 text-gray-500">
                                                {playLogs.filter(log => log.user === user.user).length} plays
                                            </td>
                                            <td className="p-2">
                                                <button
                                                    onClick={() => removeUser(index)}
                                                    className="text-red-400 hover:text-red-300"
                                                    title="Remove"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'logs' ? (
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-blue-300">Play Logs</h2>
                            <div className="text-gray-400 text-sm">
                                Total plays: {playLogs.length} | Today's wins: {playLogs.filter(p => p.data === new Date().toISOString().split('T')[0] && p.vincita).length}
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-4 gap-4">
                            <input
                                type="text"
                                placeholder="Search by user, prize, date or win code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-700 border border-gray-600 rounded p-2 flex-grow text-white"
                            />
                            <button
                                onClick={() => downloadCSV(sortedPlayLogs, 'play_logs.csv')}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold whitespace-nowrap"
                            >
                                Export CSV
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-700">
                                        <th className="p-2">User</th>
                                        <th className="p-2">Date</th>
                                        <th className="p-2">Time</th>
                                        <th className="p-2">Result</th>
                                        <th className="p-2">Win Code</th>
                                        <th className="p-2">Win?</th>
                                        <th className="p-2">Claimed?</th>
                                        <th className="p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedPlayLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-4 text-center text-gray-500">No plays logged yet</td>
                                        </tr>
                                    ) : (
                                        sortedPlayLogs.map((log, index) => {
                                            const isUnclaimedWin = log.vincita && !log.riscosso;
                                            return (
                                                <tr key={index} className={`border-b border-gray-700 hover:bg-gray-750 ${isUnclaimedWin ? 'bg-yellow-900 bg-opacity-20' : ''}`}>
                                                    <td className="p-2">{log.user}</td>
                                                    <td className="p-2">{log.data}</td>
                                                    <td className="p-2">{log.ora}</td>
                                                    <td className="p-2">{log.risultato}</td>
                                                    <td className="p-2 font-mono text-xs">{log.winCode || '-'}</td>
                                                    <td className="p-2">
                                                        {log.vincita ? (
                                                            <span className="text-green-400 font-bold">✓ Win</span>
                                                        ) : (
                                                            <span className="text-gray-500">✗ Loss</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        {log.vincita ? (
                                                            log.riscosso ? (
                                                                <span className="text-blue-400 font-semibold">✓ Riscosso</span>
                                                            ) : (
                                                                <span className="text-yellow-400">⏳ Pending</span>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-600">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex items-center gap-2">
                                                            {log.vincita && !log.riscosso && (
                                                                <button
                                                                    onClick={() => handleClaimPrize(playLogs.indexOf(log))}
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold"
                                                                >
                                                                    Riscosso
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeletePlayLog(playLogs.indexOf(log))}
                                                                className="text-red-400 hover:text-red-300"
                                                                title="Elimina record"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-blue-300">Richieste di Registrazione</h2>
                            <div className="text-gray-400 text-sm">
                                Pending: {pendingRequestsCount}
                            </div>
                        </div>

                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => downloadCSV(requests, 'requests.csv')}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold"
                            >
                                Export CSV
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-700">
                                        <th className="p-2">Data</th>
                                        <th className="p-2">Nome</th>
                                        <th className="p-2">Email</th>
                                        <th className="p-2">Città</th>
                                        <th className="p-2">Stato</th>
                                        <th className="p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-gray-500">Nessuna richiesta presente</td>
                                        </tr>
                                    ) : (
                                        requests.map((req, index) => (
                                            <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                                                <td className="p-2 text-sm text-gray-400">
                                                    {new Date(req.dataRichiesta).toLocaleDateString()}
                                                </td>
                                                <td className="p-2 font-medium">{req.nome} {req.cognome}</td>
                                                <td className="p-2 text-sm">{req.email}</td>
                                                <td className="p-2 text-sm">{req.citta}</td>
                                                <td className="p-2">
                                                    {req.creato ? (
                                                        <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-900 bg-opacity-30 rounded-full">
                                                            Creato ({req.username})
                                                        </span>
                                                    ) : (
                                                        <span className="text-yellow-400 text-xs font-bold px-2 py-1 bg-yellow-900 bg-opacity-30 rounded-full">
                                                            In attesa
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        {!req.creato && (
                                                            <button
                                                                onClick={() => createUserFromRequest(index)}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold"
                                                            >
                                                                Approva
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteRequest(index)}
                                                            className="text-red-400 hover:text-red-300"
                                                            title="Elimina richiesta"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BackendScreen;
