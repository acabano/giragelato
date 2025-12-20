import React from 'react';
import { GameConfig } from '../types';

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: GameConfig | null;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose, config }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 transform transition-all scale-100">
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                        <h2 className="text-2xl font-bold text-white">Informativa e Regolamento</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors focus:outline-none"
                            aria-label="Close modal"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-6 text-gray-300">
                        {/* Regolamento */}
                        <section>
                            <h3 className="text-xl font-semibold text-white mb-3">Regolamento di Gioco</h3>
                            <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/50">
                                <p className="mb-2">
                                    Il concorso a premi "{config?.nomeDellaRuota || 'Ruota della Fortuna'}" è soggetto alle seguenti regole:
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>
                                        Probabilità di vincita: <span className="text-green-400 font-bold">{config?.winningPercentage ?? 5}%</span> per ogni giocata.
                                    </li>
                                    <li>
                                        Limite giocate: Ogni utente può effettuare un massimo di <span className="text-white font-bold">{config?.numeroGiocate ?? 1}</span> giocate al giorno.
                                    </li>
                                    <li>
                                        Limite vincite totali: Sono previste un massimo di <span className="text-white font-bold">{config?.numeroVinciteGiornaliere ?? 1}</span> vincite totali giornaliere distribuite tra tutti i partecipanti.
                                    </li>
                                </ul>
                                <p className="mt-3 text-sm text-gray-400">
                                    L'assegnazione dei premi avviene mediante un algoritmo software certificato di generazione casuale (Random Number Generator).
                                </p>
                            </div>
                        </section>

                        {/* Privacy */}
                        <section>
                            <h3 className="text-xl font-semibold text-white mb-3">Informativa Privacy (GDPR)</h3>
                            <div className="text-sm space-y-3">
                                <p>
                                    Ai sensi del Regolamento UE 2016/679 (GDPR), ti informiamo che i dati personali forniti (Nome, Cognome, Email, Telefono, Città) saranno trattati esclusivamente per le seguenti finalità:
                                </p>
                                <ul className="list-disc list-inside ml-2 space-y-1 text-gray-400">
                                    <li>Partecipazione al gioco a premi "{config?.nomeDellaRuota || 'Ruota della Fortuna'}".</li>
                                    <li>Gestione delle vincite e consegna dei premi.</li>
                                    <li>Comunicazioni strettamente relative al servizio.</li>
                                </ul>
                                <p>
                                    Il conferimento dei dati è necessario per partecipare al gioco. I tuoi dati non saranno ceduti a terzi per finalità di marketing senza il tuo esplicito consenso.
                                </p>
                                <p>
                                    Titolare del trattamento è l'organizzatore dell'evento. Hai il diritto di richiedere l'accesso, la rettifica o la cancellazione dei tuoi dati in qualsiasi momento contattando l'amministratore.
                                </p>
                            </div>
                        </section>
                    </div>

                    <div className="pt-4 border-t border-gray-700 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                        >
                            Ho capito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyModal;
