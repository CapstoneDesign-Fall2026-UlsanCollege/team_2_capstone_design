import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";
import { StorePublicMetadata } from "@/lib/api";

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
        tagline: "Specialty goods delivered across Nepal.",
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
      tagline: "Specialty goods delivered across Nepal.",
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

export default async function StorefrontCheckoutPage({
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
    <div className="min-h-dvh bg-sf-canvas text-sf-ink flex flex-col">
      {/* Distraction-Free Header (DESIGN.md §5) */}
      <header className="sticky top-0 z-30 w-full border-b border-sf-line bg-sf-surface/90 backdrop-blur-xs">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs font-sf-mono text-sf-muted hover:text-sf-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Store</span>
          </Link>

          <span className="font-sf-display text-sm sm:text-base font-bold text-sf-ink">
            {store.name}
          </span>

          <div className="inline-flex items-center gap-1 text-[11px] font-sf-mono text-sf-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-sf-accent" aria-hidden="true" />
            <span className="hidden sm:inline">Secure</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 space-y-1">
          <h1 className="font-sf-display text-xl sm:text-2xl font-bold tracking-tight text-sf-ink">
            Checkout
          </h1>
          <p className="text-xs text-sf-muted font-sf-mono">
            Fast, secure checkout powered by ShopCraft Nepal
          </p>
        </div>

        <CheckoutForm store={store} />
      </main>
    </div>
  );
}
