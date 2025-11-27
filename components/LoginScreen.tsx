import React, { useState, useEffect } from 'react';
import { User, GameConfig, UserRequest } from '../types';
import * as userService from '../services/userService';
import emailjs from '@emailjs/browser';
import logo from '../Image/Logo.png';

interface LoginScreenProps {
    onLoginSuccess: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [showRegister, setShowRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState<GameConfig | null>(null);

    // Registration form fields
    const [regNome, setRegNome] = useState('');
    const [regCognome, setRegCognome] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regTelefono, setRegTelefono] = useState('');
    const [regCitta, setRegCitta] = useState('');

    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

    useEffect(() => {
        const checkBackgroundImage = () => {
            const img = new Image();
            const bgPath = `${import.meta.env.BASE_URL}Image/sfondo.png`;

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
        const init = async () => {
            await userService.loadUsers();

            // Load config for wheel name
            try {
                const timestamp = new Date().getTime();
                const response = await fetch(`${import.meta.env.BASE_URL}data/config.json?t=${timestamp}`, {
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (response.ok) {
                    const configData = await response.json();
                    setConfig(configData);
                }
            } catch (error) {
                console.error('Failed to load config:', error);
            }

            setIsLoading(false);
        };
        init();
    }, []);

    // ... (rest of the handlers)

    // Determine background style
    const backgroundStyle = backgroundImage
        ? {
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        }
        : {};

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }

        // Reload users to ensure we have the latest data (including newly created users)
        // await userService.loadUsers(true); // Now handled inside login()

        const user = await userService.login(username, password);

        if (user) {
            onLoginSuccess(user);
        } else {
            setError('Invalid username or password.');
        }
    };

    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!forgotEmail) {
            setError('Please enter your email address.');
            return;
        }

        try {
            // Reload users to ensure we have the latest data
            await userService.loadUsers(true);
            const timestamp = new Date().getTime();
            const allUsers = await fetch(`${import.meta.env.BASE_URL}api/get-users.php?t=${timestamp}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }).then(res => res.json());

            const userAccount = allUsers.find((u: User) => u.email === forgotEmail);

            if (userAccount) {
                // Send email with credentials
                if (config?.emailProvider === 'smtp' && config.smtpConfig) {
                    // Send via SMTP API
                    const emailResponse = await fetch(`${import.meta.env.BASE_URL}api/send-email.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            smtpConfig: config.smtpConfig,
                            to: userAccount.email,
                            subject: `Password Recovery - ${config.nomeDellaRuota}`,
                            body: `
                                <h1>Password Recovery</h1>
                                <p>Hello ${userAccount.user},</p>
                                <p>You requested a password recovery.</p>
                                <p><strong>Username:</strong> ${userAccount.user}</p>
                                <p><strong>Password:</strong> ${userAccount.password}</p>
                            `
                        })
                    });

                    if (!emailResponse.ok) {
                        throw new Error('SMTP Email failed');
                    }
                } else {
                    // Send via EmailJS
                    const serviceId = config?.emailJsConfig?.serviceId || 'service_yhqh5ki';
                    const templateId = config?.emailJsConfig?.templateId || 'template_qlut1jm';
                    const publicKey = config?.emailJsConfig?.publicKey || 'k8cGZ3qhshqqt20NA';

                    await emailjs.send(
                        serviceId,
                        templateId,
                        {
                            to_email: userAccount.email,
                            to_name: userAccount.user,
                            username: userAccount.user,
                            password: userAccount.password,
                            wheel_name: config?.nomeDellaRuota || 'Wheel of Fortune',
                            email: config?.adminEmail || 'noreply@example.com'
                        },
                        publicKey
                    );
                }

                setSuccess('Password sent to your email address!');
                setTimeout(() => {
                    setShowForgotPassword(false);
                    setSuccess('');
                    setForgotEmail('');
                }, 3000);
            } else {
                // For security reasons, we might want to show the same message even if email not found,
                // but for this internal app, being specific helps.
                setError('Email address not found.');
            }
        } catch (error) {
            console.error(error);
            setError('Error processing request.');
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!regNome || !regCognome || !regEmail || !regTelefono || !regCitta) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            // Load existing requests
            const timestamp = new Date().getTime();
            const response = await fetch(`${import.meta.env.BASE_URL}data/richieste.json?t=${timestamp}`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            const requests: UserRequest[] = response.ok ? await response.json() : [];

            // Create new request
            const newRequest: UserRequest = {
                id: Date.now().toString(),
                nome: regNome,
                cognome: regCognome,
                email: regEmail,
                telefono: regTelefono,
                citta: regCitta,
                creato: false,
                dataRichiesta: new Date().toISOString()
            };

            // Add to requests array
            const updatedRequests = [...requests, newRequest];

            // Save to server
            const saveResponse = await fetch(`${import.meta.env.BASE_URL}api/save-requests.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRequests, null, 4)
            });

            if (saveResponse.ok) {
                setSuccess('Registration request sent successfully! An admin will create your account soon.');
                // Reset form
                setRegNome('');
                setRegCognome('');
                setRegEmail('');
                setRegTelefono('');
                setRegCitta('');
                // Switch back to login after 3 seconds
                // Send email to admin if configured
                // Send email to admin if configured
                if (config?.adminEmail) {
                    console.log("Attempting to send admin notification to:", config.adminEmail);
                    const EMAILJS_SERVICE_ID = 'service_yhqh5ki';
                    const EMAILJS_TEMPLATE_ID = 'template_qlut1jm';
                    const EMAILJS_PUBLIC_KEY = 'k8cGZ3qhshqqt20NA';

                    // Use existing template fields (username/password) to convey the message
                    // This is a workaround to avoid needing a new template ID immediately
                    const emailParams = {
                        to_email: config.adminEmail,
                        to_name: 'Admin',
                        username: `Nuova richiesta da: ${regNome} ${regCognome}`,
                        password: `Dettagli: ${regEmail}, ${regTelefono}, ${regCitta}`,
                        wheel_name: config.nomeDellaRuota || 'Ruota della Fortuna',
                        email: regEmail // Used for Reply-To in the template
                    };

                    emailjs.send(
                        EMAILJS_SERVICE_ID,
                        EMAILJS_TEMPLATE_ID,
                        emailParams,
                        EMAILJS_PUBLIC_KEY
                    )
                        .then((response) => {
                            console.log('ADMIN EMAIL SUCCESS!', response.status, response.text);
                        })
                        .catch((err) => {
                            console.error('ADMIN EMAIL FAILED...', err);
                        });
                } else {
                    console.warn("Admin email not configured in config.json. Skipping notification.");
                }

                setTimeout(() => {
                    setShowRegister(false);
                    setSuccess('');
                }, 3000);
            } else {
                throw new Error('Failed to save request');
            }
        } catch (error) {
            console.error(error);
            setError('Error submitting registration request.');
        }
    };

    if (isLoading) {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center text-white p-4 font-sans ${backgroundImage ? '' : 'bg-gray-900'}`} style={backgroundStyle}>
            <div className="w-full max-w-md p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <img src={logo} alt="Logo" className="h-24 w-auto" />
                </div>

                <h1 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    {config?.nomeDellaRuota || 'Gira Gelato'}
                </h1>
                <p className="text-center text-gray-400 mb-6">
                    {showRegister ? 'Register for an account' : showForgotPassword ? 'Recover Password' : 'Accedi per giocare'}
                </p>

                {!showRegister && !showForgotPassword ? (
                    // Login Form
                    <form onSubmit={handleLoginSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="username">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="e.g., testuser"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="e.g., password123"
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs italic mb-4 text-center">{error}</p>}
                        {success && <p className="text-green-500 text-xs italic mb-4 text-center">{success}</p>}
                        <button
                            type="submit"
                            className="w-full px-4 py-3 text-lg font-bold text-white bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg shadow-lg hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 transition-all duration-300 transform hover:scale-105"
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="w-full mt-2 text-sm text-purple-400 hover:text-purple-300 underline focus:outline-none"
                        >
                            Password dimenticata?
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowRegister(true)}
                            className="w-full mt-3 px-4 py-2 text-sm text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Registrati
                        </button>
                    </form>
                ) : showForgotPassword ? (
                    // Forgot Password Form
                    <form onSubmit={handleForgotPasswordSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="forgotEmail">
                                Enter your email address
                            </label>
                            <input
                                id="forgotEmail"
                                type="email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs italic mb-4 text-center">{error}</p>}
                        {success && <p className="text-green-500 text-xs italic mb-4 text-center">{success}</p>}
                        <button
                            type="submit"
                            className="w-full px-4 py-3 text-lg font-bold text-white bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg shadow-lg hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 transition-all duration-300 transform hover:scale-105"
                        >
                            Recover Password
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForgotPassword(false);
                                setError('');
                                setSuccess('');
                            }}
                            className="w-full mt-3 px-4 py-2 text-sm text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Back to Login
                        </button>
                    </form>
                ) : (
                    // Registration Form
                    <form onSubmit={handleRegisterSubmit}>
                        <div className="mb-3">
                            <label className="block text-gray-300 text-sm font-bold mb-1" htmlFor="nome">
                                Nome *
                            </label>
                            <input
                                id="nome"
                                type="text"
                                value={regNome}
                                onChange={(e) => setRegNome(e.target.value)}
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-gray-300 text-sm font-bold mb-1" htmlFor="cognome">
                                Cognome *
                            </label>
                            <input
                                id="cognome"
                                type="text"
                                value={regCognome}
                                onChange={(e) => setRegCognome(e.target.value)}
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-gray-300 text-sm font-bold mb-1" htmlFor="email">
                                Email *
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-gray-300 text-sm font-bold mb-1" htmlFor="telefono">
                                Telefono *
                            </label>
                            <input
                                id="telefono"
                                type="tel"
                                value={regTelefono}
                                onChange={(e) => setRegTelefono(e.target.value)}
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-bold mb-1" htmlFor="citta">
                                Città *
                            </label>
                            <input
                                id="citta"
                                type="text"
                                value={regCitta}
                                onChange={(e) => setRegCitta(e.target.value)}
                                className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs italic mb-4 text-center">{error}</p>}
                        {success && <p className="text-green-500 text-xs italic mb-4 text-center">{success}</p>}
                        <button
                            type="submit"
                            className="w-full px-4 py-3 text-lg font-bold text-white bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg shadow-lg hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 transition-all duration-300 transform hover:scale-105"
                        >
                            Submit Registration
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowRegister(false);
                                setError('');
                                setSuccess('');
                            }}
                            className="w-full mt-3 px-4 py-2 text-sm text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Back to Login
                        </button>
                    </form>
                )}
            </div>

            <div className="mt-8 text-center">
                <p className="text-gray-600 text-xs">Versione 1.0</p>
                <p className="text-gray-500 text-sm mt-1 font-medium italic">
                    Gioco ideato con passione da Andrea Cabano
                </p>
            </div>
        </div>
    );
};


export default LoginScreen;
