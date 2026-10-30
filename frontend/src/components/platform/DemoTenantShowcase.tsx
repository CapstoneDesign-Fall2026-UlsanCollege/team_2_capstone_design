"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";

export function DemoTenantShowcase() {
  const tenants = [
    {
      name: "BrewMellow",
      tagline: "Direct-trade Himalayan specialty coffee micro-lots roasted in Lalitpur.",
      slug: "brewmellow",
      category: "Specialty Coffee Roastery",
      themeName: "Editorial Warm",
      accentBg: "#A3432A",
      badge: "Store #1 (Seeded)",
      highlights: [
        "3 Origins: Gulmi, Nuwakot, Ilam",
        "Whole Bean & Ground Variants",
        "Prepaid 3M/6M/12M Coffee Subscriptions",
      ],
    },
    {
      name: "Himalayan Artisans",
      tagline: "Handcrafted single-estate orthodox teas, chamomile tisanes & wild herbs.",
      slug: "himalayan-artisans",
      category: "Artisanal Tea & Mountain Herbs",
      themeName: "Pahadi Sage",
      accentBg: "#2D5A43",
      badge: "Store #2 (Multi-Tenant Proof)",
      highlights: [
        "Ilam First-Flush Orthodox Black Tea",
        "Solukhumbu Organic Whole Chamomile",
        "Prepaid 3M/6M Seasonal Tea Clubs",
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tenants.map((t) => (
        <div
          key={t.slug}
          className="rounded-2xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
        >
          <div className="space-y-4">
            {/* Header / Badges */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[var(--sc-paper,#FAFAF7)] border border-[var(--sc-line,#E8E8E1)] text-[var(--sc-ink-2,#4B5060)]">
                {t.category}
              </span>
              <span
                style={{ backgroundColor: `${t.accentBg}15`, color: t.accentBg }}
                className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full"
              >
                {t.badge}
              </span>
            </div>

            {/* Store Name & Tagline */}
            <div>
              <h3 className="text-xl font-bold tracking-tight text-[var(--sc-ink,#111318)]">
                {t.name}
              </h3>
              <p className="text-xs text-[var(--sc-ink-2,#4B5060)] mt-1 leading-relaxed">
                {t.tagline}
              </p>
            </div>

            {/* Feature Bullets */}
            <ul className="space-y-1.5 pt-2 border-t border-[var(--sc-line,#E8E8E1)]/60 text-xs text-[var(--sc-ink-2,#4B5060)]">
              {t.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--sc-marigold,#F2A900)] shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Links */}
          <div className="pt-6 mt-4 border-t border-[var(--sc-line,#E8E8E1)] flex items-center gap-3">
            <Link
              href={`/s/${t.slug}`}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all text-center flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Visit Storefront</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href={`/merchant/${t.slug}`}
              className="py-2.5 px-4 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] text-[var(--sc-ink,#111318)] text-xs font-mono font-semibold hover:bg-zinc-100 transition-colors text-center flex items-center justify-center gap-1"
            >
              <span>Console</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
