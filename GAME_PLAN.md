# Dinder – Game Plan

"Dinner + Cinder": friends join a room, swipe on restaurants, and a little spark lights up when everyone finally agrees on where to eat.

---

## The Core Idea

1. Host creates a room, picks location on a map + radius + mode, gets a shareable link
2. Friends open the link — no login needed
3. Everyone swipes through restaurants one at a time (left = no, right = yes)
4. Top n most-liked restaurants are revealed when everyone finishes or the timer runs out

---

## Two Modes (build async first, sync second)

**Async Mode** — everyone votes on their own time. Results appear when all votes are in or the timer fires. Simple REST + polling. Build this first.

**Sync Mode** — everyone sees the same card simultaneously and votes together. Requires real-time communication. Build this second once the core is solid.

Both modes share the same room/voting logic — only what triggers "advance to next card" differs.

---

## Tech Stack

**Framework:** Next.js (TypeScript) — frontend pages + backend API routes in one repo, one deployment. No separate Express server needed.

**UI Components:** shadcn/ui — pre-built accessible components built on Radix UI + Tailwind. Code lives in your project so you can read and learn from it.

**Swipe gestures:** `framer-motion` — industry-standard animation library. You'll use its `drag` feature to detect swipe direction and animate cards off screen. More transferable than a purpose-built swipe lib.

**Map:** Mapbox + `react-map-gl` — free tier (50k map loads/month, no credit card). The host searches or drops a pin; we read the lat/lng directly from the map. Looks great, portfolio-worthy.

**Realtime (sync mode only):** Pusher free tier — hosted WebSocket service. Server pushes "next-card" and "results" events so all clients advance together.

**Deployment:** Vercel — free, built for Next.js, zero config.

---

## No Login: How Identity Works

- Room ID in the URL: `/room/abc123`
- Each user gets a random ID (`crypto.randomUUID()`) saved to `localStorage` on first visit
- That ID is sent with every vote so the server knows who voted what
- No accounts, no passwords, no sessions

---

## Restaurant Data: Yelp Fusion API

Free tier: 5,000 calls/day, no credit card required. Returns name, photos, rating, price level, cuisine, hours, and address — everything we need for the cards.

The host picks a location on the Mapbox map (lat/lng) and a radius. We call Yelp's `/businesses/search` endpoint with those coordinates and return the list to the room.

---

## Vote Storage: Upstash Redis

This is the most important infrastructure decision to understand.

Next.js on Vercel runs API routes as **serverless functions** — isolated processes that spin up per request and die immediately after. An in-memory `Map` would work locally but breaks in production: votes written in one request wouldn't exist when the next request reads them, because they'd hit a different process instance.

**Upstash Redis** solves this. It's a hosted key-value store (free tier: 10k commands/day, 256MB) that lives outside your server process. Every vote is written to Redis; every status check reads from Redis. Rooms auto-expire via Redis TTL — you set `EXPIRE room:abc123 86400` (24 hours) and Redis deletes it automatically.

Structure in Redis:
```
room:abc123           → JSON blob { mode, expiresAt, userIds[], restaurants[] }
room:abc123:votes     → Hash { "userId:restaurantId" → "yes"|"no" }
restaurant-cache:key  → JSON blob of Yelp results (cached 24h by area)
```

The restaurant cache key is derived from lat/lng rounded to ~1 mile + radius. Same area = same key = reuse Yelp results without burning API quota.

---

## Data Flow

**Async Mode**
```
POST /api/rooms            → create room (geocode → Yelp → store in Redis), return roomId
GET  /api/rooms/:id        → get restaurant list + timer + mode
POST /api/rooms/:id/vote   → { userId, restaurantId, vote } → write to Redis
GET  /api/rooms/:id/status → check Redis: "voting" | "done" + top n results
  (frontend polls every 4s)
```

**Sync Mode** (later)
```
Same REST endpoints +
Pusher channel per room → server pushes "next-card" and "results" events
```

---

## Room Creator Sets

- Location (Mapbox map — search or drop a pin → lat/lng)
- Radius (0.5 / 1 / 3 / 5 miles)
- Mode (Async or Sync)
- Optional time limit (e.g. 30 min for the whole session)

---

## Build Order

1. **Swipe UI with fake data** — card stack + swipe animation with `framer-motion`. No API, no backend.
2. **Room creation + join** — Next.js API routes, Mapbox location picker, Upstash Redis, localStorage user IDs
3. **Yelp integration** — real restaurants + photos based on map pin + radius
4. **Voting + polling** — POST votes to Redis, poll `/status`, show results (async mode done)
5. **Caching layer** — deduplicate Yelp calls using Redis cache key by area
6. **Sync mode** — add Pusher, synchronized card advancement

Don't touch step 2 until step 1 feels great. The swipe UX is the whole product.

---

## Open Questions (decide later)

- What if nobody matches anything? Show top n by vote count anyway?
- Users joining mid-session in sync mode — start from current card or beginning?
- Room size limit? Probably cap at 10 to keep it manageable.
- How many restaurants to load per session? Yelp returns up to 50 per call — 20 is probably the sweet spot.
