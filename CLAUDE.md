# Tuscany Trip Planner — Claude Context

Private road trip planner for a Tuscany trip (6–12 July 2026). Two users only, no auth, fully public Supabase tables. Built with Next.js 15 App Router + Tailwind v4 + Supabase + Leaflet.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, no `src/` dir) |
| Styling | Tailwind v4 — configured via `@theme` in `app/globals.css`, no `tailwind.config.ts` |
| Fonts | Google Fonts via `next/font/google` — Playfair Display (`font-playfair`) + Inter (`font-sans`) |
| Database | Supabase (Postgres) — direct client calls from client components, no API routes |
| Map | Leaflet + react-leaflet, dynamically imported (`ssr: false`) in `app/page.tsx` |
| Routing | Road-following route from OSRM public API (no key needed) |
| Deployment | Vercel, auto-deploy from `main` on GitHub |

---

## Design Tokens (Tailwind v4 custom colors)

Defined in `app/globals.css` under `@theme`:

| Class | Hex | Usage |
|---|---|---|
| `bg-parchment` | `#f5efe4` | Page background |
| `text-ink` | `#2a2118` | Primary text |
| `text-muted` | `#8a7e72` | Secondary text, labels |
| `text-terracotta` / `bg-terracotta` | `#c85a3a` | Buttons, active tabs, accents |
| `text-olive` | `#7a8c55` | Google Maps link hover, "good" status |
| `bg-wine` | `#6b2737` | Map route line, accommodation markers |
| `bg-card` | `#faf5ed` | Card backgrounds |
| `border-warm-border` | `#e0d5c5` | All card/input borders |

Never use pure white, cold greys, or the default Tailwind palette — everything stays warm.

---

## File Structure

```
app/
  globals.css       — Tailwind @theme tokens + Leaflet CSS overrides
  layout.tsx        — Font loading (Playfair Display + Inter)
  page.tsx          — Main shell: tab state, all Supabase CRUD, passes props down

components/
  TripMap.tsx       — Leaflet map (client-only). Fetches OSRM road route on mount.
                      Falls back to straight dashed line if OSRM unavailable.
  StopList.tsx      — Stop rows with hover highlight, Google Maps link, delete, inline add.
                      Inline add uses Nominatim geocoder (no key, Italy-scoped).
  BudgetForm.tsx    — Category icon-tile picker + amount/note form. Currency: DKK.
  BudgetSummary.tsx — Remaining balance, green→amber→red progress bar, grouped expense list.
  SyncStatus.tsx    — "Saving…" / "Saved" / "Save failed" indicator in header.

lib/
  supabase.ts       — Supabase client + Stop and Expense TypeScript types.
```

---

## Database (Supabase project: `qsmumsipuvglkcdmjklz`)

### `stops`
| column | type | notes |
|---|---|---|
| id | uuid PK | auto |
| position | int | display order |
| name | text | |
| note | text | shown below name in list |
| type | text | `city` \| `accommodation` \| `sight` \| `beach` \| `winery` — drives marker color |
| lat, lng | float | used for map markers + OSRM route |
| google_maps_url | text nullable | override link; falls back to `?q=lat,lng` if null |
| created_at | timestamptz | |

**14 stops are pre-seeded** (Florence → Greve → Panzano → Radda in Chianti → San Quirico → Cappella di Vitaleta → Pienza → Monticchiello → Montalcino → Golfo di Baratti → Casale Marittimo → Bolgheri → Castiglioncello → Florence return).

### `expenses`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| category | text | `lodging` \| `food` \| `wine` \| `transport` \| `activities` \| `misc` |
| amount | numeric | in DKK |
| note | text | |
| created_at | timestamptz | |

### `config`
Single row (`id = 1`). Column `budget_total numeric` — the total trip budget in DKK. Editable inline in BudgetSummary by clicking the "of DKK X" text.

---

## Key Patterns

**All data mutations go through `withSave()` in `page.tsx`** — sets `saving` state, catches errors into `saveError`, returns `boolean`. Components receive typed callbacks (`Promise<boolean>`).

**Map is always `dynamic(() => import(...), { ssr: false })`** — Leaflet accesses `window` at import time and breaks SSR. Never remove the dynamic wrapper.

**Tailwind v4 opacity modifiers work on custom colors** — `bg-terracotta/10`, `text-muted/60` etc. are valid.

**Stop type → marker color mapping** lives in both `TripMap.tsx` and `StopList.tsx` as `TYPE_COLORS`. Keep them in sync if adding new stop types.

**OSRM route** is fetched once on mount when stops load. Uses `AbortController` for cleanup. Coordinates must be passed as `lng,lat` (longitude first) to OSRM, then flipped to `[lat, lng]` for Leaflet.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://qsmumsipuvglkcdmjklz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

Both are `NEXT_PUBLIC_` — no server-only secrets, all Supabase calls happen client-side.

---

## Common Tasks

**Add a new expense category** — add to the `CATEGORIES` array in `BudgetForm.tsx` and `CATEGORY_LABELS`/`CATEGORY_ORDER` in `BudgetSummary.tsx`. Also update the `Expense['category']` union in `lib/supabase.ts`.

**Add a new stop type** — add to `TYPE_COLORS` in both `TripMap.tsx` and `StopList.tsx`. Update the `Stop['type']` union in `lib/supabase.ts`.

**Change currency** — search `DKK` across `BudgetForm.tsx` and `BudgetSummary.tsx`. It's a `CURRENCY` constant in BudgetSummary and a label string in BudgetForm.

**Change map style** — swap the TileLayer URL in `TripMap.tsx`. Currently CartoDB Voyager. A warm sepia CSS filter (`sepia(12%) saturate(85%)`) is applied to the map wrapper div.

**Add a field to stops** — run an `ALTER TABLE` migration via Supabase MCP or dashboard, add the column to the `Stop` type in `lib/supabase.ts`, update the relevant component.
