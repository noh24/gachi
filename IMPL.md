# Gachi – Implementation Checklist

Granular step-by-step breakdown per stage. Fill in steps as you plan each stage; check them off as you go. The goal is to think through dependency order *before* coding so you're not switching contexts mid-build.

---

## Stage 1: Swipe UI (fake data) ✅

Done.

---

## Stage 2: Room Creation + Join

### Map Component

- [x] Instantiate map in a single `useEffect` (empty dep array — runs once on mount)
- [x] Save map instance to a `mapRef`
- [x] Save marker instance to a `markerRef`
- [x] Save the `onChange` callback prop to an `onChangeRef` so effects can call the latest version without re-subscribing
- [x] Save last-emitted lat/lng to a `lastEmittedRef` to avoid firing duplicate onChange calls
- [x] Add a `useEffect` that watches the `location` prop — when parent changes it, fly the map + move the marker
- [x] Register a map `click` event handler that sets marker position + calls `onChange`
- [x] Register a marker `dragend` handler that reads new position + calls `onChange`

### Parent (`/create-room` page)

- [x] Create location state (`{ lat, lng } | null`)
- [x] Pass location down to Map as a prop
- [x] "Use my location" button — calls `navigator.geolocation.getCurrentPosition`, sets location state

Search Bar

- [ ] Debounce keystrokes so geocoding API isn't called on ev5ery character
- [ ] Call geocoding API with the query, get back list of suggestions with lat/lng
- [ ] Render suggestion dropdown under the input
- [ ] On suggestion select: update location state, fly map to that location

Radius Selector

- [ ] State for selected radius — fixed options: 0.5 / 1 / 3 / 5 miles
- [ ] UI: segmented button group (not a range slider — values are discrete)
- [ ] Draw a circle on the map at the selected radius using a MapLibre GeoJSON circle layer

Mode Selector

- [ ] State for selected mode — `async | sync`
- [ ] Consider renaming to something more user-friendly than "async / sync"
- [ ] Consider showing sync as "Coming Soon" (disabled) for first rollout

Time Limit

- [ ] Default to 24 hours — no UI needed for now, just hardcode on submission
- [ ] Note: expose as a user-facing option in a later pass

Submit

- [ ] Button disabled until location + radius + mode are all set
- [ ] On click: POST to `/api/rooms` with `{ lat, lng, radius, mode, expiresAt }`
- [ ] On success: redirect to `/room/[id]`

Redis Setup

Why Redis:

1. Built-in TTL — rooms auto-expire, no cleanup job needed
2. Simple key-value fit — room ID is always known, always a direct lookup
3. HTTP-based — no persistent connections, plays well with Vercel serverless

- [x] Create Upstash account and database
- [x] Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local`
- [ ] Create `src/lib/redis.ts` — import the Upstash SDK, instantiate one client with the url and token from env vars, export it
- [ ] Consider metrics: Redis has no query layer so tracking things like "how many rooms created" requires either a manual counter key, a hybrid Postgres DB later for long-term data, or a zero-config tool like Vercel Analytics
