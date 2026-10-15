import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const fullName = String(data.fullName || "Valued Subscriber").trim();
    const email = String(data.email || "subscriber@brewmellow.com").toLowerCase().trim();
    const phone = String(data.phone || "+977 9801234567").trim();
    const address = String(data.address || "Kathmandu, Nepal").trim();

    const user = {
      name: fullName,
      email,
      phone,
      address,
      is_staff: false,
      memberSince: "Oct 2026",
    };

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 400 });
  }
}
