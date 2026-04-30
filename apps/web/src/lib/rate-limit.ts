/**
 * Simple in-memory rate limiter using a sliding window.
 *
 * Usage in a Route Handler:
 *   import { rateLimit } from "@/lib/rate-limit";
 *
 *   const limiter = rateLimit({ interval: 60_000, limit: 10 });
 *
 *   export async function POST(request: Request) {
 *     const ip = request.headers.get("x-forwarded-for") ?? "unknown";
 *     const { success } = limiter.check(ip);
 *     if (!success) {
 *       return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 *     }
 *     // ... handle request
 *   }
 *
 * NOTE: This is an in-memory limiter suitable for single-instance deployments
 * and development. For production at scale (Vercel serverless), upgrade to a
 * Redis-backed solution (e.g., @upstash/ratelimit) since each serverless
 * function instance has its own memory.
 */

interface RateLimitOptions {
  /** Time window in milliseconds. */
  interval: number;
  /** Maximum number of requests per window per key. */
  limit: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

interface WindowEntry {
  timestamps: number[];
}

export function rateLimit({ interval, limit }: RateLimitOptions) {
  const windows = new Map<string, WindowEntry>();

  // Periodically clean up expired entries to prevent memory leaks
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of windows) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < interval);
      if (entry.timestamps.length === 0) {
        windows.delete(key);
      }
    }
  }, interval);

  // Allow garbage collection of the interval in serverless environments
  if (typeof cleanup === "object" && "unref" in cleanup) {
    cleanup.unref();
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const entry = windows.get(key) ?? { timestamps: [] };

      // Remove timestamps outside the current window
      entry.timestamps = entry.timestamps.filter((t) => now - t < interval);

      if (entry.timestamps.length >= limit) {
        const oldestInWindow = entry.timestamps[0]!;
        return {
          success: false,
          remaining: 0,
          resetAt: oldestInWindow + interval,
        };
      }

      entry.timestamps.push(now);
      windows.set(key, entry);

      return {
        success: true,
        remaining: limit - entry.timestamps.length,
        resetAt: now + interval,
      };
    },
  };
}
