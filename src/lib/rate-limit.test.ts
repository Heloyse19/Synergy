import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
  it('bloqueia após exceder o limite e libera depois da janela', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    const start = 1_000_000;

    expect(limiter.check('ip', start).allowed).toBe(true);
    expect(limiter.check('ip', start + 10).allowed).toBe(true);
    expect(limiter.check('ip', start + 20).remaining).toBe(0);

    const blocked = limiter.check('ip', start + 30);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(970);

    expect(limiter.check('ip', start + 1001).allowed).toBe(true);
  });

  it('isola as chaves e permite reset manual', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check('a', 0).allowed).toBe(true);
    expect(limiter.check('b', 0).allowed).toBe(true);
    expect(limiter.check('a', 1).allowed).toBe(false);
    limiter.reset('a');
    expect(limiter.check('a', 2).allowed).toBe(true);
  });
});
