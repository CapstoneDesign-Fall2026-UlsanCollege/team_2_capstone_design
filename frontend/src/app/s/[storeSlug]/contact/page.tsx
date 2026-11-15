import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { StorePublicMetadata } from "@/lib/api";
import { getServerApiOrigin } from "@/lib/env";
import { resolveStorefrontContactDetails } from "@/lib/storefront-helpers";

async function fetchStore(storeSlug: string): Promise<StorePublicMetadata | null> {
  const origin = getServerApiOrigin();
  try {
    const res = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404 || !res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function StorefrontContactPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);

  if (!store) {
    notFound();
  }

  const contact = resolveStorefrontContactDetails(store);

  return (
    <div className="min-h-dvh bg-sf-canvas text-sf-ink flex flex-col font-sf-body">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-sf-line bg-sf-surface/90 backdrop-blur-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs font-sf-mono text-sf-muted hover:text-sf-ink transition-colors min-h-[44px] shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Store</span>
          </Link>

          <span className="font-sf-display text-sm sm:text-base font-bold text-sf-ink truncate min-w-0">
            Contact {store.name}
          </span>

          <div className="inline-flex items-center gap-1 text-[11px] font-sf-mono text-sf-muted shrink-0">
            <Phone className="w-3.5 h-3.5 text-sf-accent" aria-hidden="true" />
            <span>Support</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 text-left">
        <div className="space-y-2 border-b border-sf-line pb-6">
          <h1 className="font-sf-display text-2xl sm:text-4xl font-bold tracking-tight text-sf-ink">
            Get in Touch with {store.name}
          </h1>
          <p className="text-xs sm:text-sm text-sf-muted font-sf-mono leading-relaxed">
            Have questions about an order, product details, or delivery in your ward? Reach out directly below.
          </p>
        </div>

        {!contact.hasAnyContact ? (
          <div className="p-6 rounded-sf border border-sf-line bg-sf-surface text-center space-y-2 shadow-2xs">
            <h2 className="font-sf-display text-lg font-bold text-sf-ink">
              Contact details coming soon
            </h2>
            <p className="text-xs font-sf-mono text-sf-muted leading-relaxed">
              {store.name} hasn&apos;t added direct contact details yet. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {contact.whatsappUrl && (
              <div
                className={`${
                  contact.hasAnyDetail ? "md:col-span-6" : "md:col-span-12"
                } p-5 sm:p-6 rounded-sf border border-sf-line bg-sf-surface space-y-3 shadow-2xs`}
              >
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs font-sf-mono uppercase">
                  <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                  <span>Instant WhatsApp Support</span>
                </div>
                <p className="text-xs text-sf-muted leading-relaxed">
                  Connect directly with {store.name} on WhatsApp for quick order updates, product inquiries, or doorstep delivery details.
                </p>
                <a
                  href={contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] h-11 px-4 rounded-sf bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sf-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                  <span>Open WhatsApp Chat</span>
                </a>
              </div>
            )}

            {contact.hasAnyDetail && (
              <div
                className={`${
                  contact.whatsappUrl ? "md:col-span-6" : "md:col-span-12"
                } p-5 sm:p-6 rounded-sf border border-sf-line bg-sf-surface space-y-3 text-xs font-sf-mono shadow-2xs`}
              >
                {contact.telHref && contact.phoneDisplay && (
                  <div className="flex items-start gap-3 text-sf-ink">
                    <Phone className="w-4 h-4 text-sf-muted shrink-0 mt-3" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-bold">Direct Phone</p>
                      <a
                        href={contact.telHref}
                        className="text-sf-muted hover:underline text-[11px] min-h-[44px] inline-flex items-center"
                      >
                        {contact.phoneDisplay}
                      </a>
                    </div>
                  </div>
                )}

                {contact.mailtoHref && contact.email && (
                  <div className="flex items-start gap-3 text-sf-ink">
                    <Mail className="w-4 h-4 text-sf-muted shrink-0 mt-3" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-bold">Email Support</p>
                      <a
                        href={contact.mailtoHref}
                        className="text-sf-muted hover:underline text-[11px] min-h-[44px] inline-flex items-center break-all"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>
                )}

                {contact.address && (
                  <div className="flex items-start gap-3 text-sf-ink">
                    <MapPin className="w-4 h-4 text-sf-cta shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-bold">Location &amp; Dispatch Studio</p>
                      <p className="text-sf-muted text-[11px] break-words">{contact.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
