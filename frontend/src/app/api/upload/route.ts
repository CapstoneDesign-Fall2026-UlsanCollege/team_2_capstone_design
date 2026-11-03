import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Endpoint deprecated. Use authenticated merchant media upload." },
    { status: 403 }
  );
}
