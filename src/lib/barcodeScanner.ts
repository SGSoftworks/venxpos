type BarcodeCallback = (code: string) => void;

let buffer = '';
let lastKeyTime = 0;
let callback: BarcodeCallback | null = null;
let shouldIgnore: (() => boolean) | null = null;
let listening = false;

const MIN_LENGTH = 6;
const MAX_LENGTH = 30;
const SCAN_SPEED_MS = 60;

const playBeep = (type: 'success' | 'error') => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.12;
    osc.type = 'square';

    if (type === 'success') {
      osc.frequency.value = 880;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.frequency.value = 220;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch { /* Audio no disponible */ }
};

/** Se actualiza con Date.now() cada vez que se completa un escaneo válido */
export let lastScanAt = 0;

export const setBarcodeIgnore = (fn: () => boolean) => {
  shouldIgnore = fn;
};

export const initBarcodeScanner = (onScan: BarcodeCallback) => {
  callback = onScan;
  if (listening) return;
  listening = true;

  const handler = (e: KeyboardEvent) => {
    if (shouldIgnore?.()) {
      buffer = '';
      lastKeyTime = 0;
      return;
    }

    if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
      buffer = '';
      lastKeyTime = 0;
      return;
    }

    if (e.key === 'Enter') {
      if (buffer.length >= MIN_LENGTH && buffer.length <= MAX_LENGTH) {
        e.preventDefault();
        lastScanAt = Date.now();
        callback?.(buffer);
      }
      buffer = '';
      lastKeyTime = 0;
      return;
    }

    if (e.key.length === 1) {
      const now = Date.now();
      if (lastKeyTime && now - lastKeyTime > SCAN_SPEED_MS) {
        buffer = '';
      } else if (lastKeyTime) {
        e.preventDefault();
      }
      lastKeyTime = now;
      buffer += e.key;
    }
  };

  window.addEventListener('keydown', handler, { capture: true });
};

export { playBeep };
