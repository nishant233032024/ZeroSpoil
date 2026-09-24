# ZeroSpoil

Mission-critical **perishable food surplus recovery** platform. Commercial kitchens list surplus; couriers claim batches atomically; AI evaluates safe shelf-life windows before food spoils.

> Live deployment: https://zerospoil.vercel.app  
> Repository: https://github.com/nishant233032024/ZeroSpoil

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- PostgreSQL · Prisma ORM
- Vercel AI SDK (`ai` + Groq / OpenAI) for structured shelf-life evaluation
- Zod validation · Shadcn-style UI · Tailwind CSS · Lucide
- Role protection via `src/proxy.ts` (`DONOR` | `COURIER` | `ADMIN`)

## Features

| Area | Implementation |
|------|----------------|
| Full CRUD | Create/list surplus; edit & delete **AVAILABLE** batches; admin delete terminal rows |
| Atomic claims | Conditional `UPDATE … WHERE status = 'AVAILABLE'` |
| AI shelf-life | `POST /api/ai/evaluate-shelf-life` + rate limit + heuristic fallback |
| Optimistic UI | React 19 `useOptimistic` + refresh on race failure |
| Auth | JWT httpOnly cookies; register Donor/Courier; demo seed users |
| Catalog cache | `unstable_cache` tagged `cuisine-catalog` (1h) |

See [SECURITY.md](./SECURITY.md) for threat model and production notes.

## Indian cuisine catalog

| Table | Count |
|-------|------:|
| `Cuisine` | 20 |
| `Dish` | 48 |
| Sample `FoodBatch` | 12 |

Source: `prisma/data/indian-cuisines.ts`

## Quick start

```bash
cp .env.example .env
# set DATABASE_URL + AUTH_SECRET (+ optional GROQ_API_KEY)
# set NEXT_PUBLIC_DEVELOPER_NAME / _GITHUB / _LINKEDIN to your real profiles

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Local Prisma Postgres (if used):

```bash
npx prisma dev --name zerospoil --detach
```

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Donor | `donor@zerospoil.dev` | `password123` |
| Courier | `courier@zerospoil.dev` | `password123` |
| Admin | `admin@zerospoil.dev` | `password123` |

## Routes

- `/` — overview
- `/login` — sign in + register
- `/donor/new` — create surplus
- `/donor/batches` — list / edit / delete own batches
- `/dispatch` — live queue (20s refresh)
- `/admin` — oversight + delete
- `/api/ai/evaluate-shelf-life` — shelf-life engine

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import on [Vercel](https://vercel.com/new); framework Next.js.
3. Set env: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_DEVELOPER_*`, optional AI keys.
4. Run `npx prisma db push` / seed against production DB (or a migrate job).
5. CI: `.github/workflows/ci.yml` runs lint, vitest, and build on push/PR.

```bash
npx vercel            # preview
npx vercel --prod     # production
```

## Scripts

```bash
npm run dev
npm run build
npm test
npm run lint
npm run db:push
npm run db:seed
```
