// tracker-client/src/index.ts
import type { RawEvent } from "../../types";

const flushIntervalMs = 1000;
const eventBufferSize = 3;

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

// --- внутренняя кухня ------------------------------------------

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
  const now = Date.now();
  const timeSinceLast = now - lastFlush;

  // 1. буфер заполнен – шлём сразу
  if (buffer.length >= eventBufferSize) {
    flushSoon();
    return;
  }

  // 2. ждём, чтобы не слать меньше 3 событий чаще, чем раз в секунду
  if (!flushTimer) {
    const delay = Math.max(flushIntervalMs - timeSinceLast, 0);
    flushSoon(delay); // <= 1 с
  }
}

function flushSoon(delay: number = 0) {
  if (flushTimer) clearTimeout(flushTimer);

  console.log("flush with delay:", delay);

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
