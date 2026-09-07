import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

/**
 * Minimal in-memory Redis fallback interface for local development/testing
 * when Upstash credentials are not yet supplied in the environment.
 */
interface InMemoryEntry {
  value: string;
  expiresAt: number;
}

class InMemoryRedisClient {
  private store = new Map<string, InMemoryEntry>();

  private isExpired(entry: InMemoryEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  private cleanKey(key: string): void {
    const entry = this.store.get(key);
    if (entry && this.isExpired(entry)) {
      this.store.delete(key);
    }
  }

  async set(
    key: string,
    value: string,
    options?: { nx?: boolean; ex?: number }
  ): Promise<'OK' | null> {
    this.cleanKey(key);

    if (options?.nx && this.store.has(key)) {
      return null;
    }

    const ttlMs = (options?.ex ?? 600) * 1000;
    this.store.set(key, {
      value: String(value),
      expiresAt: Date.now() + ttlMs,
    });

    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    this.cleanKey(key);
    const entry = this.store.get(key);
    return entry ? entry.value : null;
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    // Purge expired keys
    for (const [key, entry] of this.store.entries()) {
      if (this.isExpired(entry)) {
        this.store.delete(key);
      }
    }

    // Basic wildcard matching (e.g., 'seat_lock:123:*')
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matching: string[] = [];

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        matching.push(key);
      }
    }

    return matching;
  }

  async eval<T = unknown>(
    script: string,
    keys: string[],
    args: (string | number)[]
  ): Promise<T> {
    const key = keys[0];
    const expectedValue = String(args[0]);

    this.cleanKey(key);
    const entry = this.store.get(key);

    if (entry && entry.value === expectedValue) {
      this.store.delete(key);
      return 1 as unknown as T;
    }

    return 0 as unknown as T;
  }
}

/**
 * Universal Redis Client type supporting required methods.
 */
export type RedisClient = {
  set(
    key: string,
    value: string,
    opts?: { nx?: boolean; ex?: number }
  ): Promise<'OK' | null | unknown>;
  keys(pattern: string): Promise<string[]>;
  eval<T = unknown>(
    script: string,
    keys: string[],
    args: (string | number)[]
  ): Promise<T>;
  get(key: string): Promise<string | null | unknown>;
  del(...keys: string[]): Promise<number>;
};

const restUrl = process.env.UPSTASH_REDIS_REST_URL;
const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const isConfigured = Boolean(
  restUrl &&
    restToken &&
    restUrl.trim() !== '' &&
    restToken.trim() !== '' &&
    !restUrl.includes('placeholder')
);

if (!isConfigured) {
  console.warn(
    '⚠️ [AeroFlow Redis]: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured in environment. Using in-memory fallback store for development.'
  );
}

/**
 * Singleton Redis client instance.
 * Automatically connects to Upstash Redis in production, or uses an in-memory fallback in development.
 */
export const redis: RedisClient = isConfigured
  ? new Redis({
      url: restUrl!,
      token: restToken!,
    })
  : new InMemoryRedisClient();
