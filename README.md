# Ephemeral Messages

A minimal production-ready reference app for zero-knowledge, self-destructing encrypted messages.

## Architecture

- **Frontend:** Next.js App Router + React + Tailwind CSS.
- **Backend:** Cloudflare Worker-compatible edge API.
- **Storage:** Upstash Redis for encrypted payloads and short-lived rate-limit counters.
- **Encryption:** AES-GCM in the browser using the Web Crypto API.

## Security model

1. The browser generates a random 256-bit AES key.
2. The plaintext is encrypted locally before network transmission.
3. The backend stores only serialized ciphertext in Redis.
4. The raw key is placed in the URL fragment (`#key`), so it never reaches the server.
5. Reading a note consumes it with the atomic Redis command `GETDEL key`, preventing replay.
6. Redis TTL enforces automatic expiry after 1 hour, 6 hours, or 24 hours.
7. Rate limiting stores only a SHA-256 hash of the caller IP for 60 seconds.
8. The application uses no cookies, authentication, analytics, or persistent IP logging.

## Project structure

```text
apps/
  web/      Next.js frontend
  worker/   Cloudflare Worker API
```

## Environment variables

### Frontend (`apps/web/.env.local`)

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787
```

### Worker (`apps/worker/.dev.vars`)

```bash
UPSTASH_REDIS_REST_URL=https://YOUR-UPSTASH-URL.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN
ALLOWED_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=20
```

## Local development

```bash
pnpm install
pnpm dev:worker
pnpm dev:web
```

The frontend runs on `http://localhost:3000` and the worker API runs on `http://127.0.0.1:8787`.

## Production deployment

### Frontend

Deploy `apps/web` to Vercel, Cloudflare Pages, or another Next.js-compatible platform. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed worker URL.

### Worker

Deploy `apps/worker` with Wrangler:

```bash
cd apps/worker
pnpm wrangler secret put UPSTASH_REDIS_REST_URL
pnpm wrangler secret put UPSTASH_REDIS_REST_TOKEN
pnpm wrangler deploy
```

## API contract

### `POST /note`

Request body:

```json
{
  "ciphertext": "{\"alg\":\"AES-GCM\",...}",
  "ttl": 86400
}
```

Response:

```json
{ "id": "uuid-v4" }
```

### `GET /note/:id`

Returns the encrypted payload once using `GETDEL key`. Subsequent reads return `404` with `{ "ciphertext": null }`.
