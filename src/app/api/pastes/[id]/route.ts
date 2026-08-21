import { NextResponse } from "next/server";
import { redis, PasteRecord } from "@/lib/redis";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const redisKey = `paste:${id}`;

    const data = await redis.get<PasteRecord | string>(redisKey);

    if (!data) {
      return NextResponse.json(
        { error: "Paste not found, expired, or already burned." },
        { status: 404 }
      );
    }

    const record: PasteRecord =
      typeof data === "string" ? JSON.parse(data) : data;

    if (record.burnAfterRead) {
      await redis.del(redisKey);
    }

    return NextResponse.json({
      ciphertext: record.ciphertext,
      iv: record.iv,
      burnAfterRead: record.burnAfterRead,
      createdAt: record.createdAt,
    });
  } catch (error) {
    console.error("Error retrieving paste:", error);
    return NextResponse.json(
      { error: "Internal server error while retrieving paste." },
      { status: 500 }
    );
  }
}