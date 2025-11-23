
// A single AudioContext is used for the entire application.
// It should be created after a user gesture (e.g., a click).
let audioContext: AudioContext | null = null;

/**
 * Initializes the AudioContext. Must be called from a user event handler
 * to comply with browser autoplay policies.
 */
export const initAudio = (): AudioContext | null => {
    if (!audioContext && (window.AudioContext || (window as any).webkitAudioContext)) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

/**
 * Plays a simple tone with a given frequency, duration, and waveform type.
 * @param {number} frequency - The frequency of the tone in Hertz.
 * @param {number} duration - The duration of the tone in seconds.
 * @param {OscillatorType} type - The waveform type (e.g., 'square', 'sine').
 */
const playTone = (frequency: number, duration: number, type: OscillatorType = 'square') => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Set initial volume and fade out to prevent clicking artifact
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
};

/**
 * Plays the ticking sound for the spinning wheel.
 */
export const playSpinTickSound = () => {
    playTone(1200, 0.05, 'square');
};

/**
 * Plays an ascending arpeggio to signify a win.
 */
export const playWinSound = () => {
    if (!audioContext) return;
    // Ascending arpeggio C, E, G, C
    playTone(523.25, 0.1, 'sawtooth');
    setTimeout(() => playTone(659.25, 0.1, 'sawtooth'), 100);
    setTimeout(() => playTone(783.99, 0.1, 'sawtooth'), 200);
    setTimeout(() => playTone(1046.50, 0.2, 'sawtooth'), 300);
};

/**
 * Plays a descending two-tone sound to signify a loss.
 */
export const playLossSound = () => {
    if (!audioContext) return;
    // Descending notes
    playTone(440, 0.15, 'square');
    setTimeout(() => playTone(330, 0.25, 'square'), 150);
};
