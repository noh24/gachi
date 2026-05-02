# Gachi – Implementation Checklist

Granular step-by-step breakdown. Check items off as you go.

---

## Map Component

- [x] Instantiate map in a single `useEffect` (empty dep array — runs once on mount)
- [x] Save map instance to a `mapRef`
- [x] Save marker instance to a `markerRef`
- [x] Save the `onChange` callback prop to an `onChangeRef` so effects can call the latest version without re-subscribing
- [x] Save last-emitted lat/lng to a `lastEmittedRef` to avoid firing duplicate onChange calls
- [x] Add a `useEffect` that watches the `location` prop — when parent changes it, fly the map + move the marker
- [x] Register a map `click` event handler that sets marker position + calls `onChange`
- [x] Register a marker `dragend` handler that reads new position + calls `onChange`

---

## `/create-room` Page

- [x] Create location state (`{ lat, lng } | null`)
- [x] Pass location down to Map as a prop
- [x] "Use my location" button — calls `navigator.geolocation.getCurrentPosition`, sets location state

### Search Bar

- [ ] Research and pick a geocoding API (options: Mapbox Geocoding, Nominatim/OSM — decide on cost, key requirements, and response quality)
- [ ] Debounce keystrokes so geocoding API isn't called on every character
- [ ] Call geocoding API with the query, get back list of suggestions with lat/lng
- [ ] Render suggestion dropdown under the input
- [ ] On suggestion select: update location state, fly map to that location

### Radius Selector

- [ ] State for selected radius — fixed options: 0.5 / 1 / 3 / 5 miles
- [ ] UI: segmented button group (not a range slider — values are discrete)
- [ ] Draw a circle on the map at the selected radius using a MapLibre GeoJSON circle layer

### Mode Selector

- [ ] State for selected mode — `async | sync`
- [ ] Consider renaming to something more user-friendly than "async / sync"
- [ ] Consider showing sync as "Coming Soon" (disabled) for first rollout

### Time Limit

- [ ] Default to 24 hours — no UI needed for now, just hardcode on submission
- [ ] Note: expose as a user-facing option in a later pass

### Submit

- [ ] Button disabled until location + radius + mode are all set
- [ ] On click: POST to `/api/rooms` with `{ lat, lng, radius, mode, expiresAt }`
- [ ] On success: redirect to `/room/[id]`

---

## Redis Setup

Why Redis:

1. Built-in TTL — rooms auto-expire, no cleanup job needed
2. Simple key-value fit — room ID is always known, always a direct lookup
3. HTTP-based — no persistent connections, plays well with Vercel serverless

- [x] Create Upstash account and database
- [x] Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local`
- [ ] Create `src/lib/redis.ts` — import the Upstash SDK, instantiate one client with the url and token from env vars, export it
- [ ] Consider metrics: Redis has no query layer so tracking things like "how many rooms created" requires either a manual counter key, a hybrid Postgres DB later for long-term data, or a zero-config tool like Vercel Analytics

---

## Yelp Client

File: `src/lib/yelp.ts`

- [ ] Add `YELP_API_KEY` to `.env.local`
- [ ] Update `src/types/restaurant.ts` — add `distance: number`, change `cuisine: string` to `categories: string[]`, make `priceLevel` optional
- [ ] Write `searchRestaurants(lat: number, lng: number): Promise<Restaurant[]>` — calls `GET https://api.yelp.com/v3/businesses/search` with Bearer token, always at 5mi (~8047m radius), limit 50, maps response to `Restaurant` type
- [ ] Pin: decide on `sort_by` — `distance` makes radius filtering predictable but `best_match` surfaces better-rated restaurants first. Revisit when wiring up.

---

## `POST /api/rooms`

File: `app/api/rooms/route.ts`

Request body: `{ lat, lng, radius, mode, expiresAt }`

Responses:

- `201 Created` + `{ roomId: string }` — room created successfully
- `422 Unprocessable Entity` + `{ error: "no restaurants found in this area" }` — valid request but Yelp returned 0 results; no room is created
- `400 Bad Request` + `{ error: string }` — missing or invalid fields

Flow:

- [ ] Validate incoming request body (lat, lng, radius, mode all required)
- [ ] Round lat/lng to 2 decimal places to form Yelp cache key (e.g. `restaurant-cache:37.77:-122.41`) — no radius in key
- [ ] Check Redis for existing results at that cache key
- [ ] If cache miss: call Yelp Fusion API at 5mi (max radius) and cache the full result with 24h TTL
- [ ] Filter cached results down to the requested radius using the `distance` field Yelp returns on each result
- [ ] If 0 restaurants remain after filtering: return 422
- [ ] Generate roomId (decide: `crypto.randomUUID()` vs `nanoid` for shorter URLs)
- [ ] Write room to Redis: `room:<roomId>` → `{ mode, expiresAt, status: "voting", userIds: [], restaurants: [...] }` with TTL matching expiresAt
- [ ] Return `201 + { roomId }`

---

## `GET /api/rooms/[id]`

File: `app/api/rooms/[id]/route.ts`

Responses:

- `200 OK` + `{ mode, expiresAt, restaurants[] }` — full room data, frontend uses what it needs
- `404 Not Found` + `{ error: "room not found" }` — roomId doesn't exist or Redis TTL has expired

Flow:

- [ ] Read `room:<roomId>` from Redis
- [ ] If null: return 404
- [ ] Return 200 with full room data

---

## `POST /api/rooms/[id]/join`

File: `app/api/rooms/[id]/join/route.ts`

Request body: `{ userId }`

Responses:

- `200 OK` — user registered in room
- `404 Not Found` + `{ error: "room not found" }` — roomId doesn't exist or expired

Flow:

- [ ] Read `room:<roomId>` from Redis
- [ ] If null: return 404
- [ ] Add userId to `userIds` array if not already present
- [ ] Write updated room back to Redis
- [ ] Return 200

---

## `GET /api/rooms/[id]/votes`

File: `app/api/rooms/[id]/votes/route.ts`

Query param: `?userId=...`

Responses:

- `200 OK` + `{ votes: { [restaurantId]: "yes" | "no" } }` — all votes this user has cast in this room
- `404 Not Found` + `{ error: "room not found" }` — roomId doesn't exist or expired

Flow:

- [ ] Read `room:<roomId>` from Redis — if null return 404
- [ ] Read `room:<roomId>:votes` hash from Redis
- [ ] Filter entries by userId prefix, return as `{ restaurantId: vote }` map

---

## `POST /api/rooms/[id]/vote`

File: `app/api/rooms/[id]/vote/route.ts`

Request body: `{ userId, restaurantId, vote: "yes" | "no" }`

Responses:

- `200 OK` — vote stored
- `400 Bad Request` + `{ error: string }` — missing fields, invalid vote value, or userId not registered in room
- `404 Not Found` + `{ error: "room not found" }` — roomId doesn't exist or expired

Flow:

- [ ] Validate request body — userId, restaurantId, vote all required; vote must be `"yes"` or `"no"`
- [ ] Read `room:<roomId>` from Redis — if null return 404
- [ ] Verify userId is in room's `userIds` array — if not return 400
- [ ] Write `"userId:restaurantId" → vote` to `room:<roomId>:votes` hash in Redis
- [ ] Return 200

Note: duplicate votes (same userId + restaurantId) are silently overwritten — the `/room/[id]` page already filters out voted restaurants so this should never happen in practice.

---

## Web Push Setup

What it is: a browser standard for sending notifications to users even when they're not on the site. VAPID is the key pair that proves notifications come from your server — messages are signed with your private key and verified by the browser's push service before delivery. Payload is end-to-end encrypted.

- [ ] `npm install web-push`
- [ ] Generate VAPID key pair once: `npx web-push generate-vapid-keys`
- [ ] Add to `.env.local`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL` (any email, required by spec)
- [ ] Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to `.env.local` — same value as `VAPID_PUBLIC_KEY`, prefixed so Next.js exposes it to the frontend
- [ ] Create `src/lib/webpush.ts` — initialize `web-push` with VAPID details, export a `sendNotification(subscription, payload)` helper

---

## Service Worker

**`public/sw.js`** — only contains event listeners, nothing else. Must exist before `/room/[id]` page can register it.

- [ ] Create `public/sw.js`
- [ ] Add `push` event listener — parses payload from server, calls `self.registration.showNotification(title, options)`
- [ ] Add `notificationclick` event listener — opens/focuses the results page URL from the notification payload

**`POST /api/rooms/[id]/subscribe`** — stores the browser's push subscription in Redis so `finalize.ts` can notify this user later:

- [ ] Create `app/api/rooms/[id]/subscribe/route.ts`
- [ ] Request body: `{ userId, subscription }`
- [ ] Read `room:<roomId>` from Redis — if null return 404
- [ ] Write to `room:<roomId>:subscriptions` hash: `userId → JSON.stringify(subscription)`
- [ ] Return 200

---

## `/room/[id]` Page

- [ ] On mount: check localStorage for existing userId — if none, generate with `crypto.randomUUID()` and save
- [ ] Call `POST /api/rooms/[id]/join` with userId — if 404, show "room not found or expired" and stop
- [ ] Register service worker: check `'serviceWorker' in navigator` first (feature detection), then call `navigator.serviceWorker.register('/sw.js')` — the browser deduplicates automatically so calling this on every page load won't register multiple workers, it returns the existing registration if already registered
- [ ] Request notification permission from user
- [ ] If granted: subscribe with `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: NEXT_PUBLIC_VAPID_PUBLIC_KEY })`, POST subscription to `POST /api/rooms/[id]/subscribe`
- [ ] If denied: continue anyway — user just won't receive a push notification when voting ends
- [ ] Fire `GET /api/rooms/[id]` and `GET /api/rooms/[id]/votes?userId=...` in parallel with `Promise.all()`
- [ ] Filter restaurants client-side: exclude any restaurantId the user has already voted on
- [ ] Proceed to swipe UI with filtered restaurant list, passing `restaurants`, `roomId`, `userId` as props

## `src/lib/finalize.ts`

Not a route — a plain shared async function imported and called directly by the vote endpoint and the expire route. Lives in `src/lib/` alongside `redis.ts` and `webpush.ts`.

Function signature: `async function finalizeRoom(roomId: string): Promise<void>`

- [ ] Read `room:<roomId>` from Redis
- [ ] Check `room.status` — if already `"done"` return early (idempotency guard: prevents duplicate notifications if vote endpoint and QStash both trigger close together)
- [ ] Write `status: "done"` to room blob in Redis before sending anything
- [ ] Read `room:<roomId>:subscriptions` hash from Redis
- [ ] For each subscription: call `sendNotification(subscription, payload)` from `src/lib/webpush.ts` — payload is the results page URL (`/room/<roomId>/results`)
- [ ] Skip any userId with no stored subscription (user denied notification permission)

---

## `POST /api/rooms/[id]/expire`

File: `app/api/rooms/[id]/expire/route.ts`

Called only by QStash at `expiresAt`. Verifies the request is from QStash then calls `finalizeRoom()`.

**QStash signature verification** — first thing, before anything else:

- [ ] `npm install @upstash/qstash`
- [ ] Add `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` to `.env.local` (from Upstash dashboard)
- [ ] Use `Receiver.verify()` from `@upstash/qstash` — reads `Upstash-Signature` header + raw request body, recomputes HMAC using signing keys, checks match. Two keys exist so QStash can rotate secrets without breaking in-flight requests.
- [ ] If verification fails: return 401
- [ ] Call `finalizeRoom(roomId)` from `src/lib/finalize.ts`
- [ ] Return 200

---

## `POST /api/rooms/[id]/vote` — Completion Check

Update to the existing vote endpoint — added after the vote is written to Redis:

- [ ] Call `HLEN room:<roomId>:votes` — returns total votes cast
- [ ] Compare against `room.userIds.length × room.restaurants.length` — `room` is already in memory from the earlier Redis read at the top of the route
- [ ] If equal: call `finalizeRoom(roomId)` from `src/lib/finalize.ts`, return `200 + { done: true }`
- [ ] If not equal: return `200 + { done: false }`

Note: frontend checks `done` on every vote response — if `true`, redirect to `/room/[id]/results` immediately. This handles the user who cast the last vote since they won't receive a push notification (they're already in the app).

---

## Swipe UI — Wire to Real Data

Updates to the existing swipe UI component built in Stage 1.

- [ ] Accept `restaurants: Restaurant[]`, `roomId: string`, `userId: string` as props instead of fake data
- [ ] On each swipe: call `POST /api/rooms/[id]/vote` with `{ userId, restaurantId, vote: "yes"|"no" }`
- [ ] Check `done` in vote response — if `true`, redirect to `/room/[id]/results`
- [ ] When all cards are exhausted and `done: false`: show waiting screen — "You're done! You'll get a notification when everyone finishes."

---

## QStash Scheduling

Added inside `POST /api/rooms`, after the room is successfully written to Redis.

- [ ] `npm install @upstash/qstash` (if not already installed from expire route)
- [ ] Add `QSTASH_TOKEN` to `.env.local` (from Upstash dashboard — separate from signing keys, this authenticates your server to QStash when scheduling)
- [ ] After room write: call `client.publishJSON({ url: 'https://yourapp.com/api/rooms/[roomId]/expire', notBefore: expiresAt })` — `notBefore` is a Unix timestamp, QStash holds the message and fires at exactly that time
- [ ] Replace `yourapp.com` with actual Vercel deployment URL at build time

Local dev problem — Pin: QStash needs a publicly accessible URL, localhost doesn't work. Options:

- **ngrok** — tool that creates a temporary public tunnel to your localhost. Run it alongside your dev server and give QStash the ngrok URL.
- **Vercel preview deployment** — push your branch to GitHub, Vercel auto-deploys it to a unique public URL (e.g. `https://gachi-git-branchname-yourname.vercel.app`). Fully live, QStash can hit it. No local setup needed but requires a deploy to test each change.

Only need to verify it works once — pick one when you get here. ngrok is fastest for a one-time check; rc branch on Vercel is cleaner if you want a persistent staging URL for future testing too.

---

## `GET /api/rooms/[id]/results`

File: `app/api/rooms/[id]/results/route.ts`

Responses:

- `200 OK` + `{ restaurants: Restaurant[] }` — top N sorted by yes vote count, with yes count included per restaurant
- `{ status: "voting" }` — room exists but voting isn't done yet, frontend redirects back to room page
- `404 Not Found` + `{ error: "room not found" }` — roomId doesn't exist or expired

Flow:

- [ ] Read `room:<roomId>` from Redis — if null return 404
- [ ] Check `room.status` — if not `"done"` return `{ status: "voting" }`
- [ ] Read `room:<roomId>:votes` hash from Redis
- [ ] Tally yes votes: group entries by restaurantId, count `"yes"` values per restaurant
- [ ] Sort by yes count descending, take top N — Pin: decide on N (likely 3–5)
- [ ] Return results with yes count per restaurant

---

## `/room/[id]/results` Page

File: `app/room/[id]/results/page.tsx`

Users land here from either tapping the push notification or being redirected after casting the last vote.

- [ ] Get userId from localStorage
- [ ] Call `GET /api/rooms/[id]/results`
- [ ] If `{ status: "voting" }` returned: redirect back to `/room/[id]` — user landed here too early
- [ ] If 404: show "room not found or expired"
- [ ] Display top N restaurants: name, photo, rating, price, yes vote count
