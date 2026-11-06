import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { StorePublicMetadata } from "@/lib/api";
import { StorefrontAccountClient } from "./StorefrontAccountClient";

async function fetchStore(storeSlug: string): Promise<StorePublicMetadata | null> {
  const origin = process.env.DJANGO_API_ORIGIN || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      return {
        slug: storeSlug,
        name: storeSlug,
        tagline: "Quality goods delivered across Nepal.",
        currency: "NPR",
        theme_preset: "editorial-warm",
        logo_url: "",
        accent_color: "",
        contact_phone: "9801234567",
        inside_valley_shipping_minor: 10000,
        outside_valley_shipping_minor: 20000,
        free_shipping_threshold_minor: null,
      };
    }
    return await res.json();
  } catch {
    return {
      slug: storeSlug,
      name: storeSlug,
      tagline: "Quality goods delivered across Nepal.",
      currency: "NPR",
      theme_preset: "editorial-warm",
      logo_url: "",
      accent_color: "",
      contact_phone: "9801234567",
      inside_valley_shipping_minor: 10000,
      outside_valley_shipping_minor: 20000,
      free_shipping_threshold_minor: null,
    };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);
  return {
    title: store ? `Customer Account · ${store.name}` : "Customer Account",
    description: "Manage your past orders, delivery addresses, and customer profile.",
  };
}

export default async function StorefrontAccountPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);

  if (!store) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="w-full min-h-dvh bg-[var(--canvas)] flex items-center justify-center text-xs text-[var(--ink-2)]">
          Loading account...
        </div>
      }
    >
      <StorefrontAccountClient store={store} />
    </Suspense>
  );
}
