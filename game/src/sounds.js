// Tiny synthesized sounds: short beeps and a sizzle made with the browser's
// built-in audio, no sound files. The audio context is created on the first
// player gesture, so a silent page (or a screenshot) never complains.

let context = null;

function audio() {
  if (context) return context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  } catch {
    return null;
  }
  return context;
}

/** One short oscillator blip. */
function blip(frequency, seconds, type, gain) {
  const ctx = audio();
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const volume = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(gain, ctx.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    oscillator.connect(volume).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + seconds);
  } catch {
    // Sound is garnish: a failure here must never break the game.
  }
}

/** A burst of filtered noise, like oil hitting a hot wok. */
function sizzle(seconds) {
  const ctx = audio();
  if (!ctx) return;
  try {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4200;
    const volume = ctx.createGain();
    volume.gain.value = 0.12;
    source.connect(filter).connect(volume).connect(ctx.destination);
    source.start();
  } catch {
    // Sound is garnish: a failure here must never break the game.
  }
}

export const sounds = {
  /** Unlock audio on the first gesture, then play a soft pop. */
  unlock() {
    const ctx = audio();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  },
  add() { blip(660, 0.08, 'sine', 0.12); },
  serve() { blip(523, 0.1, 'triangle', 0.14); setTimeout(() => blip(784, 0.14, 'triangle', 0.14), 90); sizzle(0.25); },
  wrong() { blip(160, 0.18, 'sawtooth', 0.08); },
  expire() { blip(220, 0.25, 'square', 0.08); setTimeout(() => blip(147, 0.3, 'square', 0.08), 160); },
  click() { blip(440, 0.05, 'sine', 0.08); },
  over() { blip(392, 0.2, 'triangle', 0.12); setTimeout(() => blip(311, 0.2, 'triangle', 0.12), 180); setTimeout(() => blip(233, 0.35, 'triangle', 0.12), 360); },
};
