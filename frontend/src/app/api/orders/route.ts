import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Fallback in-memory orders if Neon is unreachable
const FALLBACK_ORDERS = [
  {
    id: 17,
    origin_id: 3,
    origin_name: "Nuwakot Heritage",
    weight_kg: 2.0,
    plan_id: "3M",
    plan_name: "3-Month Prepaid Cycle",
    total_price_npr: 6270,
    is_fake_payment: true,
    status: "DELIVERED",
    customer_name: "Aarav Sharma",
    customer_email: "aarav.sharma@gmail.com",
    customer_phone: "+977 9841234567",
    delivery_address: "House #12, Baluwatar, Kathmandu, Nepal",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 15,
    origin_id: 3,
    origin_name: "Nuwakot Heritage",
    weight_kg: 2.0,
    plan_id: "PAYG",
    plan_name: "Pay Monthly (Single Roast)",
    total_price_npr: 2200,
    is_fake_payment: true,
    status: "CONFIRMED",
    customer_name: "Rohan Gurung",
    customer_email: "rohan.gurung@outlook.com",
    customer_phone: "+977 9856012345",
    delivery_address: "Lakeside Ward 6, Pokhara, Nepal",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 14,
    origin_id: 2,
    origin_name: "Ilam Gold",
    weight_kg: 0.5,
    plan_id: "6M",
    plan_name: "6-Month Prepaid Connoisseur",
    total_price_npr: 3780,
    is_fake_payment: true,
    status: "DISPATCHED",
    customer_name: "Priya Shrestha",
    customer_email: "priya.shrestha@gmail.com",
    customer_phone: "+977 9801987654",
    delivery_address: "Jhamsikhel Ward 3, Lalitpur, Nepal",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 13,
    origin_id: 1,
    origin_name: "Gulmi Reserve",
    weight_kg: 1.0,
    plan_id: "3M",
    plan_name: "3-Month Prepaid Cycle",
    total_price_npr: 3420,
    is_fake_payment: true,
    status: "ROASTING",
    customer_name: "Aarav Sharma",
    customer_email: "aarav.sharma@gmail.com",
    customer_phone: "+977 9841234567",
    delivery_address: "House #12, Baluwatar, Kathmandu, Nepal",
    created_at: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    const rows = await sql`
      SELECT 
        id, 
        origin_id, 
        origin_name, 
        weight_kg, 
        plan_id, 
        plan_name, 
        total_price_npr, 
        is_fake_payment, 
        status, 
        customer_name, 
        customer_email, 
        customer_phone, 
        delivery_address, 
        created_at
      FROM orders_order 
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Neon DB query failed, using seeded fallback:", error);
    return NextResponse.json(FALLBACK_ORDERS);
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const data = raw.order || raw;

    const origin_id = Number(data.origin_id) || 1;
    const origin_name = String(data.origin_name || "Gulmi Reserve");
    const weight_kg = Number(data.weight_kg) || 1.0;
    const plan_id = String(data.plan_id || "PAYG");
    const plan_name = String(data.plan_name || "Pay per delivery");
    const total_price_npr = Math.round(Number(data.total_price_npr) || 1200);
    const is_fake_payment = Boolean(data.is_fake_payment ?? true);
    const status = is_fake_payment ? "PAID_TEST" : "CONFIRMED";
    const customer_name = String(data.customer_name || "Guest Customer");
    const customer_email = String(data.customer_email || "customer@example.com").toLowerCase().trim();
    const customer_phone = String(data.customer_phone || "+977 9801234567");
    const delivery_address = String(data.delivery_address || "Kathmandu, Nepal");
    const created_at = new Date().toISOString();

    try {
      const inserted = await sql`
        INSERT INTO orders_order (
          origin_id, 
          origin_name, 
          weight_kg, 
          plan_id, 
          plan_name, 
          total_price_npr, 
          is_fake_payment, 
          status, 
          customer_name, 
          customer_email, 
          customer_phone, 
          delivery_address, 
          created_at
        ) VALUES (
          ${origin_id}, 
          ${origin_name}, 
          ${weight_kg}, 
          ${plan_id}, 
          ${plan_name}, 
          ${total_price_npr}, 
          ${is_fake_payment}, 
          ${status}, 
          ${customer_name}, 
          ${customer_email}, 
          ${customer_phone}, 
          ${delivery_address}, 
          ${created_at}
        )
        RETURNING *
      `;
      return NextResponse.json(inserted[0], { status: 201 });
    } catch (dbErr) {
      console.warn("DB insert fallback:", dbErr);
      const fallbackNew = {
        id: Math.floor(Math.random() * 9000) + 1000,
        origin_id,
        origin_name,
        weight_kg,
        plan_id,
        plan_name,
        total_price_npr,
        is_fake_payment,
        status,
        customer_name,
        customer_email,
        customer_phone,
        delivery_address,
        created_at,
      };
      return NextResponse.json(fallbackNew, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create order" }, { status: 400 });
  }
}
