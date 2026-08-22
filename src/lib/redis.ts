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
      const rawUrl =
        process.env.UPSTASH_REDIS_REST_URL ||
        "https://proven-adder-137705.upstash.io";

      const rawToken =
        process.env.UPSTASH_REDIS_REST_TOKEN ||
        "gQAAAAAAAhnpAAIgcDI2MjgwOWY5MGQyNGM0YTI0OTlhYWYyNDI3MjJhYmFhNQ";

      const url = rawUrl.replace(/^["']|["']$/g, "").trim();
      const token = rawToken.replace(/^["']|["']$/g, "").trim();

      redisInstance = new Redis({ url, token });
    }
    return (redisInstance as any)[prop];
  },
});