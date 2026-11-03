import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { StorePublicMetadata } from "@/lib/api";
import { StorefrontSubscriptionsClient } from "@/components/storefront/StorefrontSubscriptionsClient";

async function fetchStoreMetadata(storeSlug: string): Promise<StorePublicMetadata | null> {
  const origin = process.env.DJANGO_API_ORIGIN || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function StorefrontSubscriptionsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await fetchStoreMetadata(storeSlug);

  if (!store) {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-sf-canvas text-sf-ink flex flex-col font-sf-body">
      <header className="sticky top-0 z-30 w-full border-b border-sf-line bg-sf-surface/90 backdrop-blur-xs">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs font-sf-mono text-sf-muted hover:text-sf-ink transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to {store.name}</span>
          </Link>

          <div className="inline-flex items-center gap-1 text-[11px] font-sf-mono text-sf-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-sf-accent" aria-hidden="true" />
            <span>No Auto-Debit Guarantee</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="font-sf-display text-2xl sm:text-3xl font-bold tracking-tight text-sf-ink">
            My Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-sf-muted font-sf-body">
            Track prepaid 3/6/12-delivery balances, confirm pay-per-delivery renewals, or adjust upcoming dispatch dates.
          </p>
        </div>

        <StorefrontSubscriptionsClient
          storeSlug={store.slug}
          storeName={store.name}
        />
      </main>

      <footer className="border-t border-sf-line bg-sf-surface py-6 px-4 text-center text-xs text-sf-muted font-sf-mono">
        <p>{store.name} · Powered by ShopCraft</p>
      </footer>
    </div>
  );
}
