// Limitador de requisições em memória (janela fixa).
// Suficiente para uma instância; a Cloudflare faz o rate limiting principal na borda (ver docs/deploy.md).

type Entry = { count: number; resetAt: number };

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterMs: number };

export function createRateLimiter(options: { limit: number; windowMs: number }) {
  const store = new Map<string, Entry>();

  function cleanup(now: number) {
    if (store.size < 1000) return;
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      cleanup(now);
      const entry = store.get(key);
      if (!entry || entry.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + options.windowMs });
        return { allowed: true, remaining: options.limit - 1, retryAfterMs: 0 };
      }
      entry.count += 1;
      if (entry.count > options.limit) {
        return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
      }
      return { allowed: true, remaining: options.limit - entry.count, retryAfterMs: 0 };
    },
    reset(key: string) {
      store.delete(key);
    },
  };
}

type Limiters = {
  login: ReturnType<typeof createRateLimiter>;
  register: ReturnType<typeof createRateLimiter>;
};

// Guardado em globalThis para sobreviver ao hot reload em desenvolvimento.
const globalLimiters = globalThis as unknown as { __synergyLimiters?: Limiters };

export const limiters: Limiters = (globalLimiters.__synergyLimiters ??= {
  login: createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 }),
  register: createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 }),
});
