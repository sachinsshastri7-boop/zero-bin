import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { redis, PasteRecord } from "@/lib/redis";

// Enforce dynamic execution to prevent build-time static evaluation
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ciphertext, iv, burnAfterRead, ttlSeconds } = body;

    if (!ciphertext || !iv) {
      return NextResponse.json(
        { error: "Missing required cryptographic payload." },
        { status: 400 }
      );
    }

    if (ciphertext.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Payload exceeds maximum allowed size of 2MB." },
        { status: 413 }
      );
    }

    const id = nanoid(10);
    const key = `paste:${id}`;

    const record: PasteRecord = {
      ciphertext,
      iv,
      burnAfterRead: Boolean(burnAfterRead),
      createdAt: Date.now(),
    };

    const ttl = Math.min(Math.max(Number(ttlSeconds) || 86400, 60), 604800);

    await redis.set(key, JSON.stringify(record), { ex: ttl });

    return NextResponse.json(
      { id, expiresAt: Date.now() + ttl * 1000 },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error storing paste:", error);
    return NextResponse.json(
      { error: "Internal server error while saving paste." },
      { status: 500 }
    );
  }
}