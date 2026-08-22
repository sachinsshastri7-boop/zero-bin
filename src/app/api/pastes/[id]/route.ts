import { NextResponse } from "next/server";
import { redis, PasteRecord } from "@/lib/redis";

// Enforce runtime execution to prevent build-time static evaluation
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const key = `paste:${id}`;

    const record = await redis.get<PasteRecord | string>(key);

    if (!record) {
      return NextResponse.json(
        { error: "Paste not found or expired." },
        { status: 404 }
      );
    }

    const parsedRecord: PasteRecord =
      typeof record === "string" ? JSON.parse(record) : record;

    if (parsedRecord.burnAfterRead) {
      await redis.del(key);
    }

    return NextResponse.json(parsedRecord, { status: 200 });
  } catch (error) {
    console.error("Error retrieving paste:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching paste." },
      { status: 500 }
    );
  }
}