import { NextRequest, NextResponse } from "next/server";

function getUpstreamOrigin(): string {
  return (
    process.env.DJANGO_API_ORIGIN ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
}

const NO_USER_RESPONSE = () =>
  NextResponse.json(
    { authenticated: false, user: null },
    {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    }
  );

export async function GET(req: NextRequest) {
  const origin = getUpstreamOrigin();
  if (!origin) {
    return NO_USER_RESPONSE();
  }

  try {
    const cookie = req.headers.get("cookie") || "";
    const res = await fetch(`${origin}/api/auth/me/`, {
      method: "GET",
      headers: cookie ? { cookie } : undefined,
      cache: "no-store",
    });

    if (!res.ok) {
      return NO_USER_RESPONSE();
    }

    const data = await res.json();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NO_USER_RESPONSE();
  }
}

export async function PATCH(req: NextRequest) {
  const origin = getUpstreamOrigin();
  if (!origin) {
    return NextResponse.json(
      { detail: "Authentication service unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  try {
    const headers: Record<string, string> = {};
    const cookie = req.headers.get("cookie");
    const csrf = req.headers.get("x-csrftoken");
    const contentType = req.headers.get("content-type");
    if (cookie) headers["cookie"] = cookie;
    if (csrf) headers["x-csrftoken"] = csrf;
    if (contentType) headers["content-type"] = contentType;

    const body = await req.text();
    const res = await fetch(`${origin}/api/auth/me/`, {
      method: "PATCH",
      headers,
      body,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: res.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { detail: "Authentication service unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
