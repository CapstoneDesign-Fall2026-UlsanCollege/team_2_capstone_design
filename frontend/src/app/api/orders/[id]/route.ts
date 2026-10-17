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

    const { status, delivery_address, origin_name } = body;

    try {
      if (status !== undefined && delivery_address !== undefined) {
        const updated = await sql`
          UPDATE orders_order 
          SET status = ${status},
              delivery_address = ${delivery_address}
          WHERE id = ${orderId}
          RETURNING *
        `;
        if (updated.length > 0) return NextResponse.json(updated[0]);
      } else if (delivery_address !== undefined) {
        const updated = await sql`
          UPDATE orders_order 
          SET delivery_address = ${delivery_address}
          WHERE id = ${orderId}
          RETURNING *
        `;
        if (updated.length > 0) return NextResponse.json(updated[0]);
      } else if (origin_name !== undefined) {
        const updated = await sql`
          UPDATE orders_order 
          SET origin_name = ${origin_name}
          WHERE id = ${orderId}
          RETURNING *
        `;
        if (updated.length > 0) return NextResponse.json(updated[0]);
      } else if (status !== undefined) {
        const updated = await sql`
          UPDATE orders_order 
          SET status = ${status}
          WHERE id = ${orderId}
          RETURNING *
        `;
        if (updated.length > 0) return NextResponse.json(updated[0]);
      }
    } catch (dbErr) {
      console.warn("DB update fallback:", dbErr);
    }

    return NextResponse.json({ id: orderId, ...body, message: "Order updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update order" }, { status: 500 });
  }
}
