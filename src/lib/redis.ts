import { Redis } from "@upstash/redis";

export interface PasteRecord {
  ciphertext: string;
  iv: string;
  burnAfterRead: boolean;
  createdAt: number;
}

const url =
  process.env.UPSTASH_REDIS_REST_URL ||
  "https://proven-adder-137705.upstash.io";

const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  "gQAAAAAAAhnpAAIgcDI2MjgwOWY5MGQyNGM0YTI0OTlhYWYyNDI3MjJhYmFhNQ";

export const redis = new Redis({
  url: url.trim(),
  token: token.trim(),
});