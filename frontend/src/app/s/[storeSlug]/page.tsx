import { notFound } from "next/navigation";

interface StorePublicData {
  slug: string;
  name: string;
  tagline: string;
  currency: string;
  theme_preset: string;
  contact_phone: string;
  inside_valley_shipping_minor: number;
}

async function fetchStore(storeSlug: string): Promise<StorePublicData | null> {
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
        tagline: "Specialty products roasted and curated in Nepal.",
        currency: "NPR",
        theme_preset: "editorial-warm",
        contact_phone: "9801234567",
        inside_valley_shipping_minor: 10000,
      };
    }
    return await res.json();
  } catch {
    return {
      slug: storeSlug,
      name: storeSlug,
      tagline: "Specialty products roasted and curated in Nepal.",
      currency: "NPR",
      theme_preset: "editorial-warm",
      contact_phone: "9801234567",
      inside_valley_shipping_minor: 10000,
    };
  }
}

export default async function StorefrontHomePage({
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
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sf bg-sf-surface border border-sf-line text-xs font-sf-mono text-sf-muted">
          <span className="inline-block w-2 h-2 rounded-full bg-sf-accent" aria-hidden="true" />
          <span>In Stock · Fresh Dispatch</span>
        </div>

        <h1 className="font-sf-display text-2xl sm:text-3xl font-bold tracking-tight text-sf-ink">
          {store.name}
        </h1>

        <p className="text-sm text-sf-muted max-w-xl leading-relaxed">
          {store.tagline || "Artisanal goods delivered across Kathmandu Valley and nationwide."}
        </p>

        {store.contact_phone && (
          <p className="text-xs text-sf-muted font-sf-mono">
            Support: <span className="text-sf-ink">{store.contact_phone}</span>
          </p>
        )}
      </section>

      <section className="p-6 rounded-sf bg-sf-surface border border-sf-line space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-sf-display text-base font-semibold text-sf-ink">
              Store Catalog
            </h2>
            <p className="text-xs text-sf-muted">
              Live products and subscriptions will appear here in Phase 2.
            </p>
          </div>
          <span className="font-sf-mono text-xs px-2 py-0.5 rounded-sf border border-sf-line bg-sf-canvas text-sf-ink tabular-nums">
            NPR
          </span>
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 rounded-sf bg-sf-cta text-sf-cta-ink font-medium text-xs font-sf-mono hover:opacity-90 transition-opacity"
          >
            Explore Catalog
          </button>
        </div>
      </section>
    </div>
  );
}
