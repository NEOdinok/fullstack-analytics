// tracker-client/src/index.ts
import type { RawEvent } from "../../types";

const flushIntervalMs = 1000;
const eventBufferSize = 3;

interface Tracker {
  track(event: string, ...tags: string[]): void;
}

export const tracker: Tracker = {
  track(event: string, ...tags: string[]) {
    buffer.push(buildEvent(event, tags));

    scheduleFlush();
  },
};

// --- внутренняя кухня ------------------------------------------

const buffer: Array<RawEvent> = [];

let lastFlush = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const ENDPOINT = "http://localhost:8888/track";

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
  const currentTime = Date.now();
  const bufferFilled = buffer.length >= eventBufferSize;
  const flushIntervalPassed = currentTime - lastFlush > flushIntervalMs;

  const shouldFlush = bufferFilled || flushIntervalPassed;

  if (shouldFlush) flushSoon();
  else if (!flushTimer) flushSoon(1000 - (currentTime - lastFlush));
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
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true, // чтобы запрос дожил при закрытии вкладки
    });
  } catch {
    // проблема сети — вернём события в очередь и попробуем через 1 с
    buffer.unshift(...payload);

    flushSoon(flushIntervalMs);
  }
}

function trackAllBeforePageCloses() {
  window.addEventListener("beforeunload", () => {
    if (buffer.length) navigator.sendBeacon?.(ENDPOINT, JSON.stringify(buffer));
  });
}

trackAllBeforePageCloses();
