import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { StorePublicMetadata } from "@/lib/api";
import { getServerApiOrigin } from "@/lib/env";
import { ContactFormClient } from "./ContactFormClient";

async function fetchStore(storeSlug: string): Promise<StorePublicMetadata | null> {
  const origin = getServerApiOrigin();
  try {
    const res = await fetch(`${origin}/api/stores/${encodeURIComponent(storeSlug)}/`, {
      next: { revalidate: 60 },
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

  const cleanPhone = (store.contact_phone || "9801234567").replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/977${cleanPhone}?text=${encodeURIComponent(
    `Hello ${store.name}! I would like to inquire about your products.`
  )}`;

  return (
    <div className="min-h-dvh bg-sf-canvas text-sf-ink flex flex-col font-sf-body">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-sf-line bg-sf-surface/90 backdrop-blur-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href={`/s/${encodeURIComponent(store.slug)}`}
            className="inline-flex items-center gap-1.5 text-xs font-sf-mono text-sf-muted hover:text-sf-ink transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Store</span>
          </Link>

          <span className="font-sf-display text-sm sm:text-base font-bold text-sf-ink truncate max-w-[200px] sm:max-w-none">
            Contact {store.name}
          </span>

          <div className="inline-flex items-center gap-1 text-[11px] font-sf-mono text-sf-muted">
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
            Have questions about an order, custom request, or delivery in your ward? We&apos;re here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left: Contact Info & WhatsApp (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Direct WhatsApp Box */}
            <div className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs font-sf-mono uppercase">
                <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span>Instant WhatsApp Support</span>
              </div>
              <p className="text-xs text-sf-muted leading-relaxed">
                Connect directly with our team for quick order updates, product inquiries, or doorstep delivery details.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] h-11 px-4 rounded-sf bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sf-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>Open WhatsApp Chat</span>
              </a>
            </div>

            {/* Direct Details */}
            <div className="p-5 rounded-sf border border-sf-line bg-sf-surface space-y-3.5 text-xs font-sf-mono shadow-2xs">
              <div className="flex items-start gap-3 text-sf-ink">
                <MapPin className="w-4 h-4 text-sf-cta shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Location &amp; Dispatch Studio</p>
                  <p className="text-sf-muted text-[11px]">{store.address || "Kathmandu Valley, Nepal"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sf-ink">
                <Clock className="w-4 h-4 text-sf-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Support Hours</p>
                  <p className="text-sf-muted text-[11px]">Sun – Fri: 9:00 AM – 6:30 PM NPT</p>
                </div>
              </div>

              {cleanPhone && (
                <div className="flex items-start gap-3 text-sf-ink">
                  <Phone className="w-4 h-4 text-sf-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Direct Phone</p>
                    <a href={`tel:+977${cleanPhone}`} className="text-sf-muted hover:underline text-[11px]">
                      +977 {store.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {store.contact_email && (
                <div className="flex items-start gap-3 text-sf-ink">
                  <Mail className="w-4 h-4 text-sf-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Email Support</p>
                    <a href={`mailto:${store.contact_email}`} className="text-sf-muted hover:underline text-[11px]">
                      {store.contact_email}
                    </a>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right: Contact Form Client (7 cols) */}
          <div className="md:col-span-7">
            <ContactFormClient storeName={store.name} />
          </div>

        </div>

      </main>
    </div>
  );
}
