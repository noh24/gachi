# Gachi

> Create a room, invite friends, and decide where to eat — together. No sign in required!

Gachi (같이 — "together" in Korean) is a group restaurant-decision app. The host creates a room, everyone swipes on restaurants, and the top picks are revealed when the votes are in.

## How it works

1. Host creates a room and shares the link
2. Everyone swipes right on restaurants they want, left on ones they don't
3. See what everyone agreed on

## Getting started

```bash
git clone https://github.com/your-username/gachi.git
cd gachi
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```env
GOOGLE_PLACES_API_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

> Note: env vars are not required to run locally during development — fake data is used until the backend is wired up.

## Tech stack

- **Next.js 16 + TypeScript** — frontend and API routes
- **shadcn/ui + Tailwind** — UI components
- **Framer Motion** — swipe gestures and animations
- **Mapbox + MapLibre GL** — location picker, map, and geocoding
- **Google Places API** — restaurant data and photos
- **Upstash Redis** — vote storage and room state
- **Vercel** — deployment
