import { type RawEvent } from "@/types.js";

const flushIntervalMs = 1000;
const eventBufferSize = 3;

const portApi = Number(import.meta.env.VITE_PORT_API ?? 8888);
const appUrl = import.meta.env.VITE_APP_URL ?? "http://localhost";

const buffer: Array<RawEvent> = [];

interface Tracker {
  track(event: string, ...tags: string[]): void;
}

export const tracker: Tracker = {
  track(event: string, ...tags: string[]) {
    buffer.push(buildEvent(event, tags));

    scheduleFlush();
  },
};

declare global {
  interface Window {
    tracker: Tracker;
  }
}
window.tracker = tracker;

let lastFlush = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const endpoint = `${appUrl}:${portApi}/track`;

function buildEvent(event: string, tags: string[]): RawEvent {
  const currentTimeSeconds = Math.floor(Date.now() / 1000);
  return {
    event,
    tags,
    url: location.href,
    title: document.title,
    ts: currentTimeSeconds,
  };
}

function scheduleFlush() {
  const now = Date.now();
  const timeSinceLast = now - lastFlush;

  if (buffer.length >= eventBufferSize) {
    flushSoon();
    return;
  }

  if (!flushTimer) {
    const timeLeftToFlush = Math.max(flushIntervalMs - timeSinceLast, 0);

    flushSoon(timeLeftToFlush);
  }
}

function flushSoon(delay: number = 0) {
  if (flushTimer) clearTimeout(flushTimer);

  flushTimer = setTimeout(flush, delay);
}

async function flush() {
  flushTimer = null;

  if (buffer.length === 0) return;

  const payload = buffer.splice(0, buffer.length);

  lastFlush = Date.now();

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    console.warn("Error sending analytic event. Retrying", err);

    setTimeout(() => {
      buffer.unshift(...payload);
      scheduleFlush();
    }, flushIntervalMs);
  }
}

function trackAllBeforePageCloses() {
  window.addEventListener("beforeunload", () => {
    if (buffer.length) navigator.sendBeacon?.(endpoint, JSON.stringify(buffer));
  });
}

trackAllBeforePageCloses();
