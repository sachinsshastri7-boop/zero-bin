import { NextResponse } from "next/server";
import { redis, PasteRecord } from "@/lib/redis";

// Enforce dynamic execution to prevent Vercel build-time pre-rendering errors
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const redisKey = `paste:${id}`;

    // Fetch record from Redis
    let data = await redis.get<PasteRecord | string>(redisKey);

    if (!data) {
      return NextResponse.json(
        { error: "Paste not found, expired, or already burned." },
        { status: 404 }
      );
    }

    let record: PasteRecord =
      typeof data === "string" ? JSON.parse(data) : data;

    // Burn after read: Atomically delete the key on access
    if (record.burnAfterRead) {
      const atomicData = await redis.getdel<PasteRecord | string>(redisKey);
      if (!atomicData) {
        return NextResponse.json(
          { error: "Paste not found, expired, or already burned." },
          { status: 404 }
        );
      }
      record = typeof atomicData === "string" ? JSON.parse(atomicData) : atomicData;
    }

    return NextResponse.json(
      {
        ciphertext: record.ciphertext,
        iv: record.iv,
        burnAfterRead: record.burnAfterRead,
        createdAt: record.createdAt,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error retrieving paste:", error);
    return NextResponse.json(
      { error: "Internal server error while retrieving paste." },
      { status: 500 }
    );
  }
}