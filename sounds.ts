// A self-contained module for playing notification sounds using the Web Audio API.

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  // Lazy initialize the AudioContext
  if (audioContext && audioContext.state !== 'closed') {
    return audioContext;
  }
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  } catch (e) {
    console.error("Web Audio API is not supported in this browser");
    return null;
  }
};

/**
 * A generic function to play a sound with a given frequency and duration.
 * @param frequency The frequency of the tone in Hertz.
 * @param duration The duration of the tone in seconds.
 * @param type The type of waveform (e.g., 'sine', 'triangle').
 * @param volume The volume of the sound (0 to 1).
 * @param onEnded An optional callback to run after the sound finishes.
 */
const playSound = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  onEnded?: () => void
) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Browsers may suspend the AudioContext until a user gesture. Attempt to resume it.
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Fade in and out to prevent clicking
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

  if (onEnded) {
    oscillator.onended = onEnded;
  }
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

/**
 * Plays a short, noticeable sound for an incoming message.
 */
export const playMessageSound = () => {
  playSound(1000, 0.1, 'triangle', 0.2);
};

/**
 * Plays an ascending two-tone sound to indicate a successful connection.
 */
export const playConnectSound = () => {
  playSound(523, 0.1, 'sine', 0.3, () => {
    playSound(784, 0.1, 'sine', 0.3);
  });
};

/**
 * Plays a descending two-tone sound to indicate a disconnection.
 */
export const playDisconnectSound = () => {
  playSound(784, 0.1, 'sine', 0.3, () => {
    playSound(523, 0.1, 'sine', 0.3);
  });
};
