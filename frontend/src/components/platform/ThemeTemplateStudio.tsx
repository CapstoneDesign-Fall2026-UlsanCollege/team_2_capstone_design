"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LookCardDef {
  id: string;
  label: string;
  niche: string;
  tag: string;
  storeNamePlaceholder?: string;
  productTitle: string;
  price: string;
  imageSrc: string;
  cardClass: string;
  staggered?: boolean;
  outlineCta?: boolean;
}

const LOOK_CARDS: LookCardDef[] = [
  {
    id: "editorial-warm",
    label: "Warm editorial",
    niche: "Coffee, ceramics, craft",
    tag: "Roastery",
    productTitle: "Gulmi Reserve",
    price: "Rs. 750",
    imageSrc: "/images/products/gulmi-reserve.svg",
    cardClass: "platform-screen-editorial",
    outlineCta: true,
  },
  {
    id: "pahadi-sage",
    label: "Botanical",
    niche: "Tea, honey, wellness",
    tag: "Harvest",
    productTitle: "Wild Cliff Honey",
    price: "Rs. 1,650",
    imageSrc: "/images/products/himalayan-honey.svg",
    cardClass: "platform-look-botanical",
    staggered: true,
  },
  {
    id: "midnight-obsidian",
    label: "Dark craft",
    niche: "Studio drops, limited runs",
    tag: "Limited run",
    productTitle: "Ilam Gold",
    price: "Rs. 2,350",
    imageSrc: "/images/products/ilam-gold.svg",
    cardClass: "platform-look-darkcraft",
  },
  {
    id: "ktm-bold",
    label: "Clean cotton",
    niche: "Everyday retail",
    tag: "Daily goods",
    productTitle: "Nuwakot Heritage",
    price: "Rs. 1,450",
    imageSrc: "/images/products/nuwakot-heritage.svg",
    cardClass: "platform-look-cotton",
    staggered: true,
  },
];

interface ThemeTemplateStudioProps {
  storeName?: string;
  slug?: string;
}

export function ThemeTemplateStudio({ storeName = "" }: ThemeTemplateStudioProps) {
  const trimmedName = storeName.trim();
  const displayStoreName = trimmedName || "Your Store";

  return (
    <section
      id="looks"
      className="py-20 sm:py-32 bg-paper border-t border-line scroll-mt-16 overflow-x-clip"
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7">
        <div className="max-w-[820px] mx-auto text-center">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-3 font-medium">
            Storefront looks
          </p>
          <h2 className="mt-4 font-display font-semibold tracking-[-0.048em] leading-none text-ink text-[36px] sm:text-[60px] lg:text-[76px]">
            Pick a look. <span className="text-accent">Make it yours.</span>
          </h2>
          <p className="mt-4 sm:mt-5 mx-auto max-w-[560px] text-base sm:text-lg text-ink-2 leading-relaxed">
            Four ready-made looks, each with its own type and colour. Pick one, add your logo, and switch whenever you like.
          </p>
        </div>

        {/* Mobile horizontal snap peek carousel; Desktop 4-col staggered grid */}
        <div className="mt-10 sm:mt-16 flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 -mx-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 no-scrollbar pb-2 lg:pb-8">
          {LOOK_CARDS.map((card) => {
            const nextWizard = trimmedName
              ? `/merchant/new?theme=${encodeURIComponent(card.id)}&name=${encodeURIComponent(trimmedName)}`
              : `/merchant/new?theme=${encodeURIComponent(card.id)}`;
            const href = `/signup?next=${encodeURIComponent(nextWizard)}`;

            return (
              <div
                key={card.id}
                className={`w-[74%] shrink-0 snap-start sm:w-auto flex flex-col ${
                  card.staggered ? "lg:translate-y-7" : ""
                }`}
              >
                <div
                  className={`flex-1 rounded-[26px] p-5 border border-line flex flex-col justify-between ${card.cardClass}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-base">
                      <span className="font-semibold truncate">{displayStoreName}</span>
                      <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full screen-badge shrink-0">
                        Bag (1)
                      </span>
                    </div>

                    <div className="my-4 rounded-2xl overflow-hidden aspect-[1/0.88] screen-photo">
                      <Image
                        src={card.imageSrc}
                        alt={card.productTitle}
                        width={800}
                        height={800}
                        unoptimized
                        className="w-full h-full object-cover block"
                      />
                    </div>

                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] screen-muted">
                      {card.tag}
                    </p>
                    <h3 className="text-[19px] font-medium mt-0.5 leading-snug">
                      {card.productTitle}
                    </h3>
                    <p className="font-mono text-[13px] mt-1 screen-muted">{card.price}</p>
                  </div>

                  <Link
                    href={href}
                    className={`mt-4 min-h-[44px] rounded-[10px] grid place-items-center text-[13px] font-medium transition-opacity hover:opacity-90 ${
                      card.outlineCta ? "screen-cta-outline" : "screen-cta"
                    }`}
                  >
                    Add to bag
                  </Link>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[15px] font-semibold text-ink">{card.label}</p>
                  <p className="text-[13.5px] text-ink-3">{card.niche}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
