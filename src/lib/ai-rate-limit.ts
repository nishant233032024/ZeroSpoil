import { checkRateLimit } from "@/lib/rate-limit";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

/** Simple in-memory rate limit for AI route (per IP). */
export function enforceAiRateLimit(ip: string): {
  ok: boolean;
  retryAfterSec: number;
} {
  return checkRateLimit(`ai:${ip}`, MAX_REQUESTS, WINDOW_MS);
}
