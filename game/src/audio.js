// Synthesised kitchen sounds: no audio files, everything is built with
// WebAudio oscillators and filtered noise. Created lazily on the first
// user gesture, so the page never asks for sound before it is played.
let audioContext = null;
let muted = false;
let sizzleNode = null;

export function setMuted(value) {
  muted = value;
  if (sizzleNode) sizzleNode.gain.value = 0;
}

export function isMuted() {
  return muted;
}

function context() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(frequency, duration, type, volume, when) {
  const ctx = context();
  if (!ctx || muted) return;
  const start = ctx.currentTime + (when || 0);
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type || 'sine';
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume || 0.15, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

function noiseBurst(duration, filterFrequency, volume) {
  const ctx = context();
  if (!ctx || muted) return;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFrequency;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

// One cue name per game event. Called once per frame with the events the
// world collected; unknown names are ignored.
export function playCue(name) {
  if (muted) return;
  if (name === 'chop') {
    noiseBurst(0.12, 1800, 0.5);
    tone(220, 0.08, 'square', 0.08);
  } else if (name === 'ding') {
    tone(880, 0.18, 'sine', 0.16);
    tone(1318, 0.22, 'sine', 0.12, 0.08);
  } else if (name === 'serve') {
    tone(523, 0.12, 'triangle', 0.18);
    tone(659, 0.12, 'triangle', 0.18, 0.1);
    tone(784, 0.22, 'triangle', 0.2, 0.2);
  } else if (name === 'fail') {
    tone(196, 0.35, 'sawtooth', 0.1);
    tone(147, 0.45, 'sawtooth', 0.1, 0.15);
  } else if (name === 'burn') {
    tone(110, 0.3, 'sawtooth', 0.12);
    noiseBurst(0.2, 500, 0.3);
  } else if (name === 'pickup') {
    tone(440, 0.07, 'triangle', 0.12);
  } else if (name === 'place') {
    tone(330, 0.07, 'triangle', 0.12);
    noiseBurst(0.05, 900, 0.2);
  } else if (name === 'trash') {
    noiseBurst(0.15, 300, 0.35);
  } else if (name === 'click') {
    tone(660, 0.05, 'square', 0.08);
  } else if (name === 'over') {
    tone(392, 0.25, 'triangle', 0.16);
    tone(311, 0.25, 'triangle', 0.16, 0.2);
    tone(262, 0.5, 'triangle', 0.16, 0.4);
  }
}

// A soft looping sizzle while anything cooks; start/stop each frame.
export function setSizzle(on) {
  const ctx = context();
  if (!ctx) return;
  if (on && !muted && !sizzleNode) {
    const length = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4000;
    const gain = ctx.createGain();
    gain.gain.value = 0.025;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    sizzleNode = { source, gain };
  } else if ((!on || muted) && sizzleNode) {
    try { sizzleNode.source.stop(); } catch (error) { /* already stopped */ }
    sizzleNode = null;
  }
}
