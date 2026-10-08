/**
 * In-memory sliding window rate limiter per IP address.
 */

type RecordEntry = {
  timestamps: number[];
};

const ipHits = new Map<string, RecordEntry>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 15; // 15 scans per minute per IP

// Periodically clean stale entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipHits.entries()) {
    const valid = entry.timestamps.filter((t) => now - t < WINDOW_MS);
    if (valid.length === 0) {
      ipHits.delete(ip);
    } else {
      entry.timestamps = valid;
    }
  }
}, 60 * 1000).unref?.();

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const entry = ipHits.get(ip) || { timestamps: [] };
  
  // Filter out timestamps outside window
  const validTimestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS) {
    const oldest = validTimestamps[0];
    const resetMs = Math.max(0, WINDOW_MS - (now - oldest));
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  validTimestamps.push(now);
  ipHits.set(ip, { timestamps: validTimestamps });

  return {
    allowed: true,
    remaining: MAX_REQUESTS - validTimestamps.length,
    resetMs: WINDOW_MS,
  };
}

export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp.trim();
  }
  return "127.0.0.1";
}
