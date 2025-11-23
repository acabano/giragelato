
import React from 'react';
import { Prize } from '../types';

interface ResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    prize: Prize;
    resultImage?: string;
    username?: string;
    date?: string;
    time?: string;
}

const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, prize, resultImage, username, date, time }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 rounded-lg shadow-2xl p-6 md:p-8 text-center max-w-md w-full transform transition-all duration-300 ease-out scale-95 animate-modal-enter border-2 border-purple-500"
                onClick={(e) => e.stopPropagation()}
            >
                {resultImage && <img src={resultImage} alt={prize.vincita ? "Hai Vinto" : "Ritenta Domani"} className="w-full h-48 object-cover rounded-md mb-4" />}

                {prize.vincita ? (
                    <>
                        <h2 className="text-3xl font-bold text-yellow-300 mb-2">🎉 Congratulazioni! 🎉</h2>

                        {/* Screenshot instruction */}
                        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold py-3 px-4 rounded-lg mb-4 animate-pulse">
                            <p className="text-lg">📸 FAI UNO SCREENSHOT!</p>
                            <p className="text-sm mt-1">Mostralo per ottenere il premio</p>
                        </div>

                        {/* Prize details */}
                        <div className="bg-gray-700 rounded-lg p-4 mb-4 border-2 border-yellow-400">
                            <p className="text-gray-300 text-sm mb-2">Hai vinto:</p>
                            <p className="text-3xl font-bold text-yellow-300 mb-2">{prize.premio}</p>
                        </div>

                        {/* User and play details */}
                        <div className="bg-gray-900 rounded-lg p-4 mb-4 text-left space-y-2">
                            <div className="flex justify-between border-b border-gray-700 pb-2">
                                <span className="text-gray-400 font-semibold">User:</span>
                                <span className="text-white font-bold">{username || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700 pb-2">
                                <span className="text-gray-400 font-semibold">Date:</span>
                                <span className="text-white font-bold">{date || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-700 pb-2">
                                <span className="text-gray-400 font-semibold">Time:</span>
                                <span className="text-white font-bold">{time || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400 font-semibold">Result:</span>
                                <span className="text-yellow-300 font-bold">{prize.premio}</span>
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 mb-4">
                            Presenta questo screenshot al banco per ritirare il tuo premio!
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-gray-400">Oh no!</h2>
                        <p className="text-gray-300 mt-2">Sei atterrato su:</p>
                        <p className="text-3xl font-bold text-white mt-1">{prize.premio}</p>
                        <p className="text-lg text-gray-400 mt-1">La prossima volta sarai più fortunato!</p>
                    </>
                )}

                <button
                    onClick={onClose}
                    className="mt-6 w-full px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                    Chiudi
                </button>
            </div>
            <style>{`
                @keyframes modal-enter {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-modal-enter {
                    animation: modal-enter 0.3s ease-out forwards;
                }
             `}</style>
        </div>
    );
};

export default ResultModal;
