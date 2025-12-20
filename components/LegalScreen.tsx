import React, { useState, useEffect } from 'react';
import { GameConfig } from '../types';
import { buildUrl } from '../utils/paths';

const LegalScreen: React.FC = () => {
    const [config, setConfig] = useState<GameConfig | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [privacyContent, setPrivacyContent] = useState<string>('');

    // Load configuration and background image
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const timestamp = new Date().getTime();
                const response = await fetch(buildUrl(`data/config.json?t=${timestamp}`), {
                    headers: { 'Cache-Control': 'no-cache' },
                });
                if (response.ok) {
                    const data = await response.json();
                    setConfig(data);
                }
            } catch (e) {
                console.error('Failed to load config', e);
            }
        };
        const loadBackground = () => {
            const img = new Image();
            const bgPath = buildUrl('Image/sfondo.png');
            img.onload = () => setBackgroundImage(bgPath);
            img.onerror = () => setBackgroundImage(null);
            img.src = bgPath;
        };
        loadConfig();
        loadBackground();
    }, []);

    // Load client‑specific privacy file
    useEffect(() => {
        const loadPrivacy = async () => {
            try {
                const timestamp = new Date().getTime();
                const response = await fetch(buildUrl(`legal/privacy.txt?t=${timestamp}`), {
                    headers: { 'Cache-Control': 'no-cache' },
                });
                if (response.ok) {
                    const contentType = response.headers.get('content-type') || '';
                    const text = await response.text();
                    
                    // Check if the response is HTML (likely index.html from SPA routing)
                    if (contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                        console.warn('Privacy file not found, server returned HTML');
                        setPrivacyContent('');
                    } else {
                        setPrivacyContent(text);
                    }
                } else {
                    console.warn('Privacy file not found');
                    setPrivacyContent('');
                }
            } catch (e) {
                console.error('Error loading privacy file', e);
                setPrivacyContent('');
            }
        };
        loadPrivacy();
    }, []);

    const backgroundStyle = backgroundImage
        ? {
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }
        : {};

    return (
        <div
            className={`min-h-screen flex flex-col items-center justify-center text-white p-4 font-sans ${backgroundImage ? '' : 'bg-gray-900'}`}
            style={backgroundStyle}
        >
            <div className="w-full max-w-4xl p-8 bg-gray-800/90 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        Note Legali e Probabilità di Vincita
                    </h1>
                    <a href={buildUrl('/')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
                    >
                        Torna Indietro
                    </a>
                </div>

                <div className="space-y-8 text-gray-300">
                    {/* Probability Section */}
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Probabilità di Vincita</h2>
                        <p className="mb-2">
                            In conformità con la normativa vigente in materia di trasparenza nei concorsi a premio, riportiamo di seguito le probabilità di vincita per il gioco "{config?.nomeDellaRuota || 'Ruota della Fortuna'}".
                        </p>
                        <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                            <p className="text-lg font-medium text-white">
                                Probabilità di vincita per ogni giocata:{' '}
                                <span className="text-green-400 font-bold">
                                    {config?.winningPercentage ?? 5}%
                                </span>
                            </p>
                            <p className="text-sm mt-2">
                                Il sistema utilizza un algoritmo di generazione casuale (RNG) per determinare l'esito di ogni giocata in base alla percentuale sopra indicata.
                                Inoltre, il gioco è limitato a un massimo di {config?.numeroVinciteGiornaliere ?? 1} vincite totali giornaliere e {config?.numeroGiocate ?? 1} giocate per utente al giorno.
                            </p>
                        </div>
                    </section>

                    {/* Privacy Section */}
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">Informativa Privacy (GDPR)</h2>
                        {privacyContent ? (
                            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono">
                                    {privacyContent}
                                </pre>
                            </div>
                        ) : privacyContent === '' ? (
                            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                                <p className="text-sm text-gray-400 italic">
                                    Il file informativa privacy non è disponibile. Contattare l'amministratore per maggiori informazioni.
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Caricamento informativa privacy...</p>
                        )}
                    </section>
                </div>

                <div className="mt-8 text-center border-t border-gray-700 pt-4">
                    <p className="text-xs text-gray-500">
                        Ultimo aggiornamento: {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LegalScreen;
