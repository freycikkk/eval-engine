/** @format */

export function sanitize(value: unknown, secrets: string[] | undefined, token: string | null): unknown {
  if (!secrets) return value;
  const seen = new WeakSet<object>();

  const mask = (str: string): string => {
    let out = str;
    if (token) out = out.replaceAll(token, '[access token hidden]');
    for (const secret of secrets) {
      if (secret) out = out.replaceAll(secret, '[secret]');
    }
    return out;
  };

  const walk = (val: unknown): unknown => {
    if (typeof val === 'string') return mask(val);
    if (Array.isArray(val)) return (val as unknown[]).map(walk);
    if (val !== null && typeof val === 'object') {
      if (seen.has(val)) return '[circular]';
      seen.add(val);

      const obj = val as Record<string, unknown>;

      const result: Record<string, unknown> = {};
      for (const key of Object.keys(obj)) {
        result[key] = walk(obj[key]);
      }
      return result;
    }

    return val;
  };

  return walk(value);
}
