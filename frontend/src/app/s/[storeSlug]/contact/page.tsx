import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { StorePublicMetadata } from "@/lib/api";
import { fetchPublicStoreOutcome } from "@/lib/storefront-fetch";
import { resolveStorefrontContactDetails } from "@/lib/storefront-helpers";

async function fetchStore(storeSlug: string): Promise<StorePublicMetadata | null> {
  const res = await fetchPublicStoreOutcome(storeSlug);
  return res.status === "ok" ? res.store : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await fetchStore(storeSlug);
  const slug = encodeURIComponent(store?.slug || storeSlug);
  if (!store) {
    return {
      title: "Contact Store",
      alternates: { canonical: `/s/${slug}/contact` },
    };
  }
  return {
    title: `Contact ${store.name}`,
    description: `Customer support contact details and store location for ${store.name}.`,
    alternates: { canonical: `/s/${slug}/contact` },
  };
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
    <div className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)] flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors min-h-[44px] shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Store</span>
          </Link>

          <span className="font-serif text-sm sm:text-base font-bold text-[var(--ink)] truncate min-w-0">
            Contact {store.name}
          </span>

          <div className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-2)] shrink-0">
            <Phone className="w-3.5 h-3.5 text-[var(--primary)]" aria-hidden="true" />
            <span>Support</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 text-left">
        <div className="space-y-2 border-b border-[var(--border)] pb-6">
          <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
            Get in Touch with {store.name}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
            Have questions about an order, product details, or delivery in your ward? Reach out directly below.
          </p>
        </div>

        {!contact.hasAnyContact ? (
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-2">
            <h2 className="font-serif text-lg font-bold text-[var(--ink)]">
              Contact details coming soon
            </h2>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              {store.name} hasn&apos;t added direct contact details yet. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {contact.whatsappUrl && (
              <div
                className={`${
                  contact.hasAnyDetail ? "md:col-span-6" : "md:col-span-12"
                } p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3`}
              >
                <div className="flex items-center gap-2 text-[var(--status-success-fg)] font-bold text-xs uppercase">
                  <MessageCircle className="w-4 h-4 text-[var(--status-success-fg)]" />
                  <span>Instant WhatsApp Support</span>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Connect directly with {store.name} on WhatsApp for quick order updates, product inquiries, or doorstep delivery details.
                </p>
                <a
                  href={contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] h-11 px-4 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[var(--primary-foreground)]" />
                  <span>Open WhatsApp Chat</span>
                </a>
              </div>
            )}

            {contact.hasAnyDetail && (
              <div
                className={`${
                  contact.whatsappUrl ? "md:col-span-6" : "md:col-span-12"
                } p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3 text-xs`}
              >
                {contact.telHref && contact.phoneDisplay && (
                  <div className="flex items-start gap-3 text-[var(--ink)]">
                    <Phone className="w-4 h-4 text-[var(--ink-2)] shrink-0 mt-3" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-bold">Direct Phone</p>
                      <a
                        href={contact.telHref}
                        className="text-[var(--ink-2)] hover:underline text-[11px] min-h-[44px] inline-flex items-center tabular-nums"
                      >
                        {contact.phoneDisplay}
                      </a>
                    </div>
                  </div>
                )}

                {contact.mailtoHref && contact.email && (
                  <div className="flex items-start gap-3 text-[var(--ink)]">
                    <Mail className="w-4 h-4 text-[var(--ink-2)] shrink-0 mt-3" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-bold">Email Support</p>
                      <a
                        href={contact.mailtoHref}
                        className="text-[var(--ink-2)] hover:underline text-[11px] min-h-[44px] inline-flex items-center break-all"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>
                )}

                {contact.address && (
                  <div className="flex items-start gap-3 text-[var(--ink)]">
                    <MapPin className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-bold">Location &amp; Dispatch Studio</p>
                      <p className="text-[var(--ink-2)] text-[11px] break-words">{contact.address}</p>
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
