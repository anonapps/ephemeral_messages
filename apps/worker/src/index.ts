interface Env {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  RATE_LIMIT_MAX?: string;
  ALLOWED_ORIGIN?: string;
}

const TTL_OPTIONS = new Set([3600, 21600, 86400]);
const NOTE_PREFIX = 'note:';
const RATE_LIMIT_PREFIX = 'ratelimit:';
const MAX_CIPHERTEXT_LENGTH = 200 * 1024;

type UpstashResult<T> = { result?: T; error?: string };

function responseHeaders(origin: string): HeadersInit {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
  };
}

function json(data: unknown, status = 200, origin = '*'): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: responseHeaders(origin),
  });
}

function noContent(origin: string): Response {
  return new Response(null, {
    status: 204,
    headers: responseHeaders(origin),
  });
}

async function upstashCommand<T>(env: Env, command: unknown[]): Promise<T> {
  const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify([command]),
  });

  if (!response.ok) {
    throw new Error('Redis command failed.');
  }

  const [result] = (await response.json()) as UpstashResult<T>[];

  if (result.error) {
    throw new Error(result.error);
  }

  return result.result as T;
}

async function redisSetEx(env: Env, key: string, ttl: number, value: string): Promise<void> {
  await upstashCommand(env, ['SETEX', key, ttl, value]);
}

async function redisGetDel(env: Env, key: string): Promise<string | null> {
  return upstashCommand<string | null>(env, ['GETDEL', key]);
}

async function redisCountWithTtl(env: Env, key: string, ttlSeconds: number): Promise<number> {
  return upstashCommand<number>(env, [
    'EVAL',
    'local count = redis.call("INCR", KEYS[1]); if count == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end; return count',
    1,
    key,
    ttlSeconds,
  ]);
}

async function hashValue(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getClientAddress(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
}

function generateId(): string {
  return crypto.randomUUID();
}

async function enforceRateLimit(request: Request, env: Env): Promise<boolean> {
  const ipHash = await hashValue(getClientAddress(request));
  const rateLimitKey = `${RATE_LIMIT_PREFIX}${ipHash}`;
  const count = await redisCountWithTtl(env, rateLimitKey, 60);

  return count <= Number(env.RATE_LIMIT_MAX ?? '20');
}

async function parseCreateBody(request: Request): Promise<{ ciphertext: string; ttl: number }> {
  const body = (await request.json()) as { ciphertext?: string; ttl?: number };
  const ciphertext = body.ciphertext?.trim();
  const ttl = Number(body.ttl);

  if (!ciphertext || !TTL_OPTIONS.has(ttl)) {
    throw new Error('Invalid payload.');
  }

  if (ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
    throw new Error('Ciphertext payload is too large.');
  }

  return { ciphertext, ttl };
}

async function handleCreate(request: Request, env: Env, origin: string): Promise<Response> {
  const { ciphertext, ttl } = await parseCreateBody(request);
  const id = generateId();
  await redisSetEx(env, `${NOTE_PREFIX}${id}`, ttl, ciphertext);
  return json({ id }, 201, origin);
}

async function handleRead(id: string, env: Env, origin: string): Promise<Response> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return json({ error: 'Invalid note id.' }, 400, origin);
  }

  const ciphertext = await redisGetDel(env, `${NOTE_PREFIX}${id}`);

  if (!ciphertext) {
    return json({ ciphertext: null }, 404, origin);
  }

  return json({ ciphertext }, 200, origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN ?? '*';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return noContent(origin);
    }

    try {
      if (!(await enforceRateLimit(request, env))) {
        return json({ error: 'Rate limit exceeded.' }, 429, origin);
      }

      if (request.method === 'POST' && url.pathname === '/note') {
        return await handleCreate(request, env, origin);
      }

      if (request.method === 'GET' && url.pathname.startsWith('/note/')) {
        const id = url.pathname.slice('/note/'.length);
        return await handleRead(id, env, origin);
      }

      return json({ error: 'Not found.' }, 404, origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error.';
      const status = message === 'Invalid payload.' || message === 'Ciphertext payload is too large.' ? 400 : 500;
      return json({ error: message }, status, origin);
    }
  },
};
