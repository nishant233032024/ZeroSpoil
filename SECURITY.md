# Security & production considerations

ZeroSpoil is a perishable logistics app. This document maps real-world risks to mitigations already in the codebase or recommended for production.

## Authentication & sessions

| Risk | Mitigation |
|------|------------|
| Session theft | JWT in **httpOnly** cookie (`sameSite=lax`, `secure` in production) |
| Weak secrets | `AUTH_SECRET` must be ≥32 chars; refuse to sign otherwise |
| Privilege escalation | Role checks in Server Actions **and** `src/proxy.ts` route gate |
| Self-serve admin | Registration limited to `DONOR` / `COURIER`; admin is seeded only |

## Concurrency (double-claim)

| Risk | Mitigation |
|------|------------|
| Two couriers claim one batch | Conditional SQL `UPDATE … WHERE status = 'AVAILABLE'` inside a transaction; `affected === 0` → structured failure |
| Stale optimistic UI | Claim button calls `router.refresh()` on success **and** failure |

## Input validation

| Risk | Mitigation |
|------|------------|
| Injection / malformed payloads | Zod schemas on all Server Actions and AI route body |
| Mass assignment | Only allowlisted fields written to Prisma |

## AI abuse & cost

| Risk | Mitigation |
|------|------------|
| Prompt flooding | In-memory rate limit (20 req / IP / min) on `/api/ai/evaluate-shelf-life` |
| Provider outage | Deterministic food-safety **heuristic fallback** when keys missing or model errors |
| Unsafe long shelf-life | Prompt + schema constrain `safeWindowHours` and risk levels |

## Data & privacy

| Risk | Mitigation |
|------|------------|
| Accidental secret commit | `.env*` gitignored; `.env.example` only |
| Orphan handoffs | `DispatchHandoff` cascades on batch delete |
| Donor mutates claimed food | Update/delete allowed only for `AVAILABLE` (donors); admin cannot delete `RESERVED` / `IN_TRANSIT` |

## Operational recommendations (production)

1. Move rate limiting to **Redis / Upstash** (in-memory resets per serverless isolate).
2. Add **CAPTCHA or auth** on public AI endpoint if exposed anonymously.
3. Use managed Postgres with connection pooling (Neon / Prisma Accelerate).
4. Enable Vercel Firewall / WAF for brute-force on `/login`.
5. Rotate `AUTH_SECRET` with documented session invalidation.
6. Add structured logging + alerting on claim contention rates.

## Contingency

- **DB down:** show toast errors; RSC pages fail closed (no stale writes).
- **AI down:** heuristic evaluation keeps listing flow available.
- **Race on claim:** loser sees clear message; winner proceeds to handoff.
