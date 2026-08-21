// src/lib/redis.ts
import { Redis } from "@upstash/redis";

export interface PasteRecord {
  ciphertext: string;
  iv: string;
  burnAfterRead: boolean;
  createdAt: number;
}

let redisInstance: Redis | null = null;

export const redis = new Proxy({} as Redis, {
  get(_target, prop: keyof Redis) {
    if (!redisInstance) {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        throw new Error(
          "Missing Upstash Redis environment variables: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN"
        );
      }

      redisInstance = new Redis({ url, token });
    }
    return (redisInstance as any)[prop];
  },
});