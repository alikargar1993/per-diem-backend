# Per Diem — Menu API (backend)

Thin Node backend for the [Per Diem full-stack take-home](perdiem-fullstack-coding-challenge.txt). All Square API traffic goes through this server so access tokens never reach the client.

## Stack

- **Fastify** — HTTP server
- **TypeScript** (strict, ESM)
- **tsx** — dev runner with watch
- **Square Node SDK** — sandbox Catalog & Locations (routes coming next)
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
   ```

## Scripts

| Command          | Purpose                             |
| ---------------- | ----------------------------------- |
| `yarn dev`       | Start with hot reload (`tsx watch`) |
| `yarn build`     | Compile to `dist/`                  |
| `yarn start`     | Run compiled output                 |
| `yarn typecheck` | Typecheck without emit              |

## Architecture (boilerplate)

```
src/
  config/env.ts       # Validated env (fail fast on boot)
  lib/
    errors.ts         # AppError + HTTP mapping
    square/
      client.ts       # Singleton Square SDK client
      map-square-error.ts
  plugins/
    error-handler.ts  # Consistent JSON errors
  routes/
    health.ts         # Liveness + env hint (no secrets)
  app.ts              # Fastify wiring
  index.ts            # Entry
```

**Decisions**

- **Backend proxy only** — Square token stays server-side; CORS is restricted to configured origins.
- **No database** — in-memory or cache later if needed for catalog (per challenge FAQ).
- **Square errors normalized** — routes will call `mapSquareError` so clients get stable `{ error: { code, message } }` shapes.

## What’s next

- `GET /api/locations` — Square Locations API
- `GET /api/catalog` — categories + items (with pagination)
- `GET /api/menu?locationId=` — filter by `present_at_*` / `absent_at_*` fields
- Optional: time-of-day availability, modifiers, search, cart subtotal, inventory

## Submission notes

Use **Square sandbox only**. Do not point at production merchant data.
