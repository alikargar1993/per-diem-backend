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
   | `API_GENERAL_TOKEN`   | Required on all `/api` routes (min 16 chars)             |
   | `AVAILABILITY_*_UID`  | Square selection UIDs for meal periods and day-of-week   |
   | `PORT`                | API port (default `3001`)                                |
   | `CORS_ORIGINS`        | Comma-separated client origins allowed to call the API   |

3. Seed sandbox data (2 locations, several categories/items, at least one location-specific item). See Square’s sandbox docs or Dashboard test data.

4. Run the dev server:

   ```bash
   yarn dev
   ```

5. Verify:

   ```bash
   export API_TOKEN="your-general-token"

   curl http://localhost:3001/health
   curl -H "Authorization: Bearer $API_TOKEN" http://localhost:3001/api/locations
   curl -H "Authorization: Bearer $API_TOKEN" \
     "http://localhost:3001/api/menu?locationId=YOUR_LOCATION_ID"
   curl -H "Authorization: Bearer $API_TOKEN" \
     "http://localhost:3001/api/categories"
   curl -H "Authorization: Bearer $API_TOKEN" \
     "http://localhost:3001/api/search?q=coffee"
   curl -H "Authorization: Bearer $API_TOKEN" \
     "http://localhost:3001/api/search?locationId=YOUR_LOCATION_ID&q=coffee"

   curl -X POST -H "Authorization: Bearer $API_TOKEN" \
     http://localhost:3001/api/catalog/refresh
   ```

   Replace `YOUR_LOCATION_ID` with an id from the locations response. Pass `at` (ISO 8601) to simulate the client device clock for meal-period filtering.

### Port already in use

If `yarn dev` fails with `EADDRINUSE` or **“port is already used”**, another process is bound to your API port (default `3001`).

**macOS / Linux**

1. Find what is using the port (replace `3001` with your `PORT` if different):

   ```bash
   lsof -i :3001
   ```

2. Stop that process — either close the terminal running an old dev server, or kill it by PID:

   ```bash
   kill $(lsof -ti :3001)
   ```

   If it does not exit, force kill:

   ```bash
   kill -9 $(lsof -ti :3001)
   ```

3. Start the server again:

   ```bash
   yarn dev
   ```

**Alternative:** change `PORT` in `.env` (e.g. `3002`) and point the mobile app / client at the new URL.

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
| `GET` | `/api/categories` | All catalog categories (no `locationId`) |
| `GET` | `/api/catalog` | Categories + items (all locations) |
| `GET` | `/api/menu?locationId=&at=` | Menu for one location; optional `at` (ISO 8601 client time) |
| `GET` | `/api/items/:itemId?locationId=&at=` | Item detail; location + meal-period checks |
| `GET` | `/api/search?q=&at=` | Search items; optional `locationId` to scope by location |
| `POST` | `/api/catalog/refresh` | Clears in-memory catalog cache |

Prices are returned in the smallest currency unit (cents) with a `currency` code, matching Square’s `Money` type.

## Authentication

All `/api` routes require a shared bearer token. Tokens are sent in headers only (never query strings):

- `Authorization: Bearer <token>`
- `X-Api-Token: <token>`

| Route | Token |
|-------|-------|
| `GET /health` | None |
| All other `/api/*` routes | `API_GENERAL_TOKEN` from `.env` |

Wrong or missing token → **401** with `code: "UNAUTHORIZED"`.

### Frontend example

```ts
const API_BASE = "http://localhost:3001";
const API_TOKEN = import.meta.env.VITE_API_GENERAL_TOKEN;

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${API_TOKEN}` };
}

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

async function apiPost(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
```

## Architecture

```
src/
  config/
    env.ts                  # Square + server
    auth.ts                 # API_GENERAL_TOKEN
  lib/auth/tokens.ts        # token validation
  plugins/auth.ts
  routes/
    health.ts               # public
    api/v1/                 # authenticated routes
  services/
  ...
```

**Decisions**

- **Backend proxy only** — Square token stays server-side; CORS is restricted to configured origins.
- **Catalog cache** — In-memory 5-minute TTL to avoid duplicate paginated `list` calls per session.
- **Location filter** — Uses Square’s `presentAtAllLocations` / `presentAtLocationIds` / `absentAtLocationIds` on both items and categories.
- **Menu grouping** — Items can appear under multiple categories when Square assigns multiple category ids.
- **Meal-period filter** — Item variations tagged with Square custom attribute `Availability` (SELECTION) are shown only when the active period’s selection UID matches. If the client passes `at` (ISO 8601), breakfast / lunch / dinner are resolved in the **location timezone**; if `at` is omitted, the **server machine’s local time of day** is used instead. Windows: 05:00–11:00, 11:00–15:00, 15:00–22:00. UIDs are configurable via `AVAILABILITY_*_UID` in `.env`. Variations without the attribute are always shown.
- **Day-of-week filter** — Variations tagged with Square custom attribute `AvailableDays` (SELECTION) can be limited to **weekday** and/or **weekend** selections. Configure UIDs via `AVAILABILITY_WEEKDAY_UID` and `AVAILABILITY_WEEKEND_UID`. Variations without this attribute are available every day. Both meal-period and day rules must pass for a variation to appear.

## TODO

Features and infrastructure worth adding with more time:

- **User authentication for online cart management** — Replace the single shared `API_GENERAL_TOKEN` with per-user sessions (e.g. JWT or OAuth) so carts can sync across devices, survive app reinstalls, and support guest vs signed-in flows without exposing Square credentials to the client.
- **Redis-backed caching** — Move catalog and menu responses from in-memory TTL to Redis with cache keys per `locationId` + `at` window. Shared cache across server instances reduces repeated Square Catalog API calls when many clients load the same menu, keeping Square rate limits and latency under control.
- **Modifiers on item detail** — Expose Square modifier lists on `/api/items/:id` and let the client build configurable orders.
- **Inventory / out-of-stock** — Integrate Square’s Inventory API so unavailable variations are hidden or marked on the menu.

## Submission notes

Use **Square sandbox only**. Do not point at production merchant data.
