import React from 'react';
import { GameConfig } from '../types';
import centerImage from '../Image/giragelato.png';

interface WheelProps {
    config: GameConfig;
    isSpinning: boolean;
    targetRotation: number;
    onSpinFinish: () => void;
}

const Wheel: React.FC<WheelProps> = ({ config, isSpinning, targetRotation, onSpinFinish }) => {
    const sliceAngle = 360 / config.numeroSpicchi;
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF9F1C', '#2EC4B6', '#E71D36', '#5D4E6D'];

    return (
        <div className="relative w-full h-full">
            {/* Wheel Container */}
            <div
                className="w-full h-full rounded-full transition-transform duration-[5000ms] ease-out shadow-2xl border-4 border-white overflow-hidden"
                style={{
                    transform: `rotate(${targetRotation}deg)`,
                    background: `conic-gradient(${config.premi.map((_, i) => `${colors[i % colors.length]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(', ')})`
                }}
                onTransitionEnd={onSpinFinish}
            >
                {/* Segments */}
                {config.premi.map((prize, index) => {
                    const angle = sliceAngle * index;
                    const rotation = angle + sliceAngle / 2;

                    return (
                        <div
                            key={index}
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            style={{ transform: `rotate(${rotation}deg)` }}
                        >
                            <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-start text-center origin-bottom" style={{ height: '50%' }}>
                                {/* Number Placeholder */}
                                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-md mb-0.5 md:mb-1">
                                    {index + 1}
                                </span>
                                {/* Prize Text */}
                                <span className="text-[0.6rem] sm:text-xs md:text-sm font-semibold text-white drop-shadow-sm uppercase tracking-wider max-w-[60px] sm:max-w-[80px] md:max-w-[100px] break-words leading-tight">
                                    {prize.premio}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Center Image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 z-10 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
                <img
                    src={centerImage}
                    alt="Gira Gelato"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Pointer is handled in parent, but we can add a center dot or decoration if needed */}
        </div>
    );
};

export default Wheel;
