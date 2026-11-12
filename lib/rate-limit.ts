type Bucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as unknown as {
  __tuntasRateLimit?: Map<string, Bucket>;
};

const buckets =
  globalForRateLimit.__tuntasRateLimit ??
  (globalForRateLimit.__tuntasRateLimit = new Map<string, Bucket>());

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

export function rateLimitKey(request: Request, scope: string): string {
  return `${scope}:${getClientIp(request)}`;
}

export function cleanupRateLimit(now = Date.now()) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
