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
   | `API_GENERAL_TOKEN`   | Required on all `/api` routes (min 16 chars)               |
   | `API_REFRESH_TOKEN`   | Optional; when set, mutating methods require it instead  |
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
| `POST` | `/api/catalog/refresh` | Clears catalog cache (general token until refresh is configured) |

Prices are returned in the smallest currency unit (cents) with a `currency` code, matching Square’s `Money` type.

## Authentication

Tokens are sent in headers only (never query strings):

- `Authorization: Bearer <token>`
- `X-Api-Token: <token>`

| HTTP method | Env variable | Used for |
|-------------|--------------|----------|
| `GET`, `HEAD` | `API_GENERAL_TOKEN` | Always |
| `POST`, `PUT`, `PATCH`, `DELETE`, … | `API_GENERAL_TOKEN` | Default (when `API_REFRESH_TOKEN` is unset) |
| `POST`, `PUT`, `PATCH`, `DELETE`, … | `API_REFRESH_TOKEN` | When set in `.env` |
| — | *(none)* | `GET /health` only |

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
    auth.ts                 # API_GENERAL_TOKEN (+ optional API_REFRESH_TOKEN)
  lib/auth/tokens.ts        # method → token policy (refresh when configured)
  plugins/auth.ts
  routes/
    health.ts               # public
    api/v1/                 # method-based auth on all routes
  lib/auth/tokens.ts
  services/
  ...
```

**Decisions**

- **Optional refresh token** — Set `API_REFRESH_TOKEN` later to require a separate credential on POST/PUT/PATCH/DELETE without changing route code.
- **Backend proxy only** — Square token stays server-side; CORS is restricted to configured origins.
- **Catalog cache** — In-memory 5-minute TTL to avoid duplicate paginated `list` calls per session.
- **Location filter** — Uses Square’s `presentAtAllLocations` / `presentAtLocationIds` / `absentAtLocationIds` on both items and categories.
- **Menu grouping** — Items can appear under multiple categories when Square assigns multiple category ids.
- **Meal-period filter** — Item variations tagged with Square custom attribute `Availability` (SELECTION) are shown only when the active period’s selection UID matches. If the client passes `at` (ISO 8601), breakfast / lunch / dinner are resolved in the **location timezone**; if `at` is omitted, the **server machine’s local time of day** is used instead. Windows: 05:00–11:00, 11:00–15:00, 15:00–22:00. UIDs are configurable via `AVAILABILITY_*_UID` in `.env`. Variations without the attribute are always shown.

## What’s next

- Day-of-week rules (if added in Square outside this custom attribute)
- Modifiers on item detail
- Cart subtotal, inventory

## Submission notes

Use **Square sandbox only**. Do not point at production merchant data.
