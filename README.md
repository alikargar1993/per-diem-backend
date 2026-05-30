# Per Diem — Menu API (backend)

Thin Node backend for the [Per Diem full-stack take-home](perdiem-fullstack-coding-challenge.txt). All Square API traffic goes through this server so access tokens never reach the client.

## Stack

- **Fastify** — HTTP server
- **TypeScript** (strict, ESM)
- **tsx** — dev runner with watch
- **Square Node SDK** — sandbox Catalog & Locations
- **Zod** — env and request validation

## Prerequisites

- Node.js 20+
- [Yarn](https://yarnpkg.com/)
- A [Square developer account](https://developer.squareup.com/) with a **sandbox** application

## Local setup

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Copy environment template and fill in your sandbox token:

   ```bash
   cp .env.example .env
   ```

   | Variable              | Description                                              |
   | --------------------- | -------------------------------------------------------- |
   | `SQUARE_ACCESS_TOKEN` | Sandbox access token from the Square Developer Dashboard |
   | `SQUARE_ENVIRONMENT`  | `sandbox` (required for this challenge)                  |
   | `PORT`                | API port (default `3001`)                                |
   | `CORS_ORIGINS`        | Comma-separated client origins allowed to call the API   |

3. Seed sandbox data (2 locations, several categories/items, at least one location-specific item). See Square’s sandbox docs or Dashboard test data.

4. Run the dev server:

   ```bash
   yarn dev
   ```

5. Verify:

   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3001/api/locations
   curl "http://localhost:3001/api/menu?locationId=YOUR_LOCATION_ID"
   ```

   Replace `YOUR_LOCATION_ID` with an id from the locations response.

## Scripts

| Command          | Purpose                             |
| ---------------- | ----------------------------------- |
| `yarn dev`       | Start with hot reload (`tsx watch`) |
| `yarn build`     | Compile to `dist/`                  |
| `yarn start`     | Run compiled output                 |
| `yarn typecheck` | Typecheck without emit              |

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `GET` | `/api/locations` | All Square locations |
| `GET` | `/api/catalog` | Categories + items (all locations) |
| `GET` | `/api/menu?locationId=` | Menu grouped by category for one location |
| `GET` | `/api/items/:itemId?locationId=` | Item detail (validates location availability) |
| `POST` | `/api/catalog/refresh` | Clears catalog cache and returns fresh catalog |

Prices are returned in the smallest currency unit (cents) with a `currency` code, matching Square’s `Money` type.

## Architecture

```
src/
  config/env.ts
  types/api.ts              # Client-facing DTOs
  lib/
    catalog/
      fetch-catalog.ts      # Paginated Square list + 5m cache
      location-presence.ts  # present_at_* / absent_at_* rules
      map-catalog.ts        # Square → API shapes
    errors.ts
    square/
  services/                 # Business logic
  routes/api/               # HTTP handlers
  plugins/error-handler.ts
  app.ts
  index.ts
```

**Decisions**

- **Backend proxy only** — Square token stays server-side; CORS is restricted to configured origins.
- **Catalog cache** — In-memory 5-minute TTL to avoid duplicate paginated `list` calls per session.
- **Location filter** — Uses Square’s `presentAtAllLocations` / `presentAtLocationIds` / `absentAtLocationIds` on both items and categories.
- **Menu grouping** — Items can appear under multiple categories when Square assigns multiple category ids.

## What’s next

- Time-of-day & day-of-week availability (category availability periods)
- Modifiers on item detail
- Search, cart subtotal, inventory

## Submission notes

Use **Square sandbox only**. Do not point at production merchant data.
