# Identity - Gachi

Gachi is a group restaurant-decision app. Friends create a room, swipe on restaurants, and see what everyone agreed on.

## Tech Stack

- **Next.js (TypeScript)** — frontend + API routes in one repo
- **shadcn/ui + Tailwind** — UI components
- **Framer Motion** — swipe gestures and card animations
- **Mapbox + MapLibre GL** — location picker, map, and geocoding
- **Google Places API** — restaurant data and photos
- **Upstash Redis** — vote storage and room state
- **Vercel** — deployment

## Folder structure

```folder
src/
  app/               # Next.js pages and API routes
    api/             # Backend API routes
  components/        # Shared UI components
    ui/              # shadcn/ui primitives
  lib/               # Utilities, helpers, external client setup
  types/             # Shared TypeScript types
technical_breakdown.md  # step-by-step implementation checklist. Read this for context on scope and decisions.
```

## Coding conventions

- Always use `PascalCase.tsx` for components (filename match export name)
- API routes file named `route.ts` and folder determines URL:
  e.g. `app/api/rooms/route.ts => /api/rooms` or `app/api/rooms/[id]/route.ts => /api/rooms/abc123`
- Next.js pages: same idea, always page.tsx; Folder = URL segment
- Named exports for components
- Types defined in src/types/, not inline
- No `any`
- No comments unless the why is non-obvious
