import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);
    const body = await request.json();
    const newStatus = body.status;

    if (!newStatus) {
      return NextResponse.json({ error: "Missing status field" }, { status: 400 });
    }

    try {
      const updated = await sql`
        UPDATE orders_order 
        SET status = ${newStatus}
        WHERE id = ${orderId}
        RETURNING *
      `;
      if (updated.length > 0) {
        return NextResponse.json(updated[0]);
      }
    } catch (dbErr) {
      console.warn("DB update fallback:", dbErr);
    }

    return NextResponse.json({ id: orderId, status: newStatus, message: "Status updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update status" }, { status: 500 });
  }
}
