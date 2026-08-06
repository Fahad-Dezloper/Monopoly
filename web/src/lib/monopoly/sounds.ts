
type SfxName = "cashIn" | "cashOut" | "buy" | "move" | "roll" | "eliminate" | "turn";

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
}

export function setMuted(next: boolean): void {
  muted = next;
  if (typeof window !== "undefined") {
    localStorage.setItem("robinverse_mute", next ? "1" : "0");
  }
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return muted;
  return muted || localStorage.getItem("robinverse_mute") === "1";
}

function beep(
  frequency: number,
  duration: number,
  options?: {
    type?: OscillatorType;
    gain?: number;
    when?: number;
    slideTo?: number;
  },
): void {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();

  const t0 = c.currentTime + (options?.when ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  const g = options?.gain ?? 0.08;
  osc.type = options?.type ?? "square";
  osc.frequency.setValueAtTime(frequency, t0);
  if (options?.slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, options.slideTo),
      t0 + duration,
    );
  }
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(g, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noiseBurst(duration: number, gainLevel = 0.05): void {
  if (isMuted()) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();

  const len = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.6;

  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  const gain = c.createGain();
  const t0 = c.currentTime;
  gain.gain.setValueAtTime(gainLevel, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(t0);
  src.stop(t0 + duration);
}

export function playSfx(name: SfxName): void {
  unlockAudio();
  switch (name) {
    case "cashIn":
      beep(523.25, 0.08, { type: "triangle", gain: 0.07 });
      beep(659.25, 0.1, { type: "triangle", gain: 0.08, when: 0.07 });
      beep(783.99, 0.14, { type: "triangle", gain: 0.09, when: 0.14 });
      break;
    case "cashOut":
      beep(392, 0.1, { type: "sawtooth", gain: 0.045, slideTo: 220 });
      beep(246.94, 0.14, { type: "triangle", gain: 0.05, when: 0.08 });
      break;
    case "buy":
      beep(880, 0.06, { type: "square", gain: 0.05 });
      beep(1174.7, 0.08, { type: "square", gain: 0.06, when: 0.05 });
      beep(1568, 0.16, { type: "triangle", gain: 0.07, when: 0.11 });
      break;
    case "move":
      beep(640, 0.045, { type: "triangle", gain: 0.04, slideTo: 480 });
      break;
    case "roll":
      noiseBurst(0.12, 0.04);
      beep(180, 0.08, { type: "square", gain: 0.03, when: 0.02 });
      break;
    case "eliminate":
      beep(220, 0.2, { type: "sawtooth", gain: 0.05, slideTo: 90 });
      beep(110, 0.28, { type: "triangle", gain: 0.05, when: 0.12 });
      break;
    case "turn":
      beep(523.25, 0.07, { type: "sine", gain: 0.045 });
      beep(659.25, 0.09, { type: "sine", gain: 0.04, when: 0.06 });
      break;
    default:
      break;
  }
}
