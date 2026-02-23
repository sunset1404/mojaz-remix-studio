/**
 * Elegant intro sound effects using Web Audio API
 * Simple crystalline tones - not music
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Must be called from a user gesture to unlock audio */
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

/** Soft shimmer - plays when logo appears */
export function playLogoReveal() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Two gentle sine tones for a warm "ding"
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.8);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.9);
    });
  } catch { /* silent fail */ }
}

/** Gentle whoosh - plays when text appears */
export function playTextReveal() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Filtered noise burst for a soft "whoosh"
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.3);
    filter.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);
    source.stop(now + 0.4);
  } catch { /* silent fail */ }
}

/** Ascending chime - plays when logo moves up and form appears */
export function playTransitionChime() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Three ascending notes for an elegant transition
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;

      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.09 - i * 0.015, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.8);
    });
  } catch { /* silent fail */ }
}
