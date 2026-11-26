"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";
import { slugifyStoreName } from "@/components/platform/StoreNameForm";
import { ThemeTemplateStudio } from "@/components/platform/ThemeTemplateStudio";

const HERO_SCENES = [
  {
    src: "/images/platform/hero-patan-roaster.webp",
    alt: "Coffee roaster scooping roasted whole beans into an unbranded kraft pouch in Patan",
    phrase: "for coffee roasters",
    label: "01 · Patan dispatch",
    focalClass: "object-[74%_24%]",
    motionClass: "platform-cinema-a",
  },
  {
    src: "/images/platform/hero-studio-parcels.webp",
    alt: "Kathmandu ceramic maker wrapping a stoneware cup in kraft paper and cotton twine",
    phrase: "for studio parcels",
    label: "02 · Studio counter",
    focalClass: "object-[72%_40%]",
    motionClass: "platform-cinema-b",
  },
  {
    src: "/images/platform/hero-lalitpur-handloom.webp",
    alt: "Artisan straightening handwoven shawl fringes in a Lalitpur textile studio",
    phrase: "for handloom weaves",
    label: "03 · Lalitpur craft",
    focalClass: "object-[72%_48%]",
    motionClass: "platform-cinema-c",
  },
] as const;

export function HomeInteractiveTop() {
  const [storeName, setStoreName] = useState("");
  const [activeCut, setActiveCut] = useState(0);
  const [paused, setPaused] = useState(false);
  const parallaxRef = useRef<HTMLDivElement>(null);

  const resolvedSlug = slugifyStoreName(storeName);
  const currentScene = HERO_SCENES[activeCut] ?? HERO_SCENES[0];

  useEffect(() => {
    if (paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveCut((prev) => (prev + 1) % HERO_SCENES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const handleStageMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (paused || !parallaxRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    parallaxRef.current.style.transform = `translate3d(${(-nx * 14).toFixed(1)}px, ${(-ny * 10).toFixed(1)}px, 0)`;
  };

  const handleStageLeave = () => {
    if (!parallaxRef.current) return;
    parallaxRef.current.style.transform = "translate3d(0px, 0px, 0)";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = storeName.trim();
    window.location.href = trimmed
      ? `/signup?name=${encodeURIComponent(trimmed)}&next=/merchant/new`
      : "/signup?next=/merchant/new";
  };

  return (
    <>
      {/* 1. Documentary Multi-Cut Hero */}
      <section
        aria-label="ShopCraft introduction"
        className={`relative overflow-hidden platform-hero-cinema ${
          paused ? "platform-hero-paused" : ""
        }`}
      >
        <div
          onMouseMove={handleStageMove}
          onMouseLeave={handleStageLeave}
          className="relative min-h-[660px] sm:min-h-[760px] flex flex-col justify-center overflow-hidden"
        >
          {/* Animated Multi-Cut Documentary Backdrop */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              ref={parallaxRef}
              className="platform-cinema-parallax absolute -inset-4"
            >
              {HERO_SCENES.map((scene, idx) => (
                <div
                  key={scene.src}
                  className={`platform-cinema-layer ${scene.motionClass} ${
                    idx === activeCut ? "is-active" : ""
                  }`}
                >
                  <Image
                    src={scene.src}
                    alt={scene.alt}
                    width={1376}
                    height={768}
                    priority={idx === 0}
                    sizes="100vw"
                    className={`w-full h-full object-cover ${scene.focalClass}`}
                  />
                </div>
              ))}
            </div>

            <div className="platform-hero-sun" />
            <span className="platform-hero-mote platform-hero-mote-1" />
            <span className="platform-hero-mote platform-hero-mote-2" />
            <span className="platform-hero-mote platform-hero-mote-3" />
            <div className="platform-hero-scrim-h" />
            <div className="platform-hero-scrim-b" />
          </div>

          <div className="relative z-10 max-w-[1180px] w-full mx-auto px-4 sm:px-7 pt-14 sm:pt-20 pb-20 sm:pb-24">
            <p className="text-[14px] font-medium platform-hero-muted flex items-center gap-2">
              <span className="font-devanagari text-[20px] leading-none platform-hero-accent font-semibold">
                नमस्ते
              </span>
              <span aria-hidden="true">·</span>
              <span>Built for independent shops in Nepal</span>
            </p>

            <h1 className="mt-4 font-display font-semibold tracking-[-0.044em] leading-[1.02] text-[40px] sm:text-[64px] lg:text-[76px] max-w-[12.5ch]">
              Open your shop
              <span className="block overflow-hidden pb-2 -mb-2">
                <span
                  key={currentScene.phrase}
                  className="inline-block platform-hero-accent platform-word-rise"
                >
                  {currentScene.phrase}
                </span>
              </span>
            </h1>

            <p className="mt-4 text-[16px] sm:text-[18.5px] leading-[1.6] platform-hero-body max-w-[46ch]">
              Launch at{" "}
              <span className="font-mono text-white" aria-live="polite">
                shopcraft.me/s/{resolvedSlug || "your-store"}
              </span>{" "}
              in minutes. Price in rupees, accept Khalti test mode or 98/97 Cash on Delivery, down to the ward.
            </p>

            <div className="mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 max-w-[700px] w-full">
                <form
                  onSubmit={handleSubmit}
                  className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 p-1.5 rounded-[20px] sm:rounded-full platform-hero-form transition-colors"
                >
                  <div className="flex items-center px-3.5 min-w-0 flex-1">
                    <span className="font-mono text-[13px] platform-hero-muted select-none shrink-0">
                      shopcraft.me/s/
                    </span>
                    <input
                      id="hero-store-name"
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="himalayan-roasters"
                      aria-label="Store name"
                      className="w-full min-h-[46px] bg-transparent font-mono text-[13.5px] text-white placeholder:opacity-45 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="group min-h-[46px] px-6 rounded-[14px] sm:rounded-full platform-hero-btn-primary text-[14px] font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    <span>Create my store</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </form>

                <Link
                  href="/s/himalayan-roasters"
                  className="min-h-[48px] px-5 rounded-full platform-hero-btn-secondary text-[14px] font-medium inline-flex items-center justify-center whitespace-nowrap shrink-0 transition-colors"
                >
                  See live store →
                </Link>
              </div>

              <div className="inline-flex items-center gap-3 self-start lg:self-auto rounded-full platform-hero-reel px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setPaused((prev) => !prev)}
                  aria-label={paused ? "Resume background reel" : "Pause background reel"}
                  aria-pressed={paused}
                  className="w-9 h-9 rounded-full platform-hero-reel-btn inline-flex items-center justify-center cursor-pointer transition-colors shrink-0"
                >
                  {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                <div className="pr-2 min-w-[162px]">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="text-white">{currentScene.label}</span>
                    <span className="platform-hero-accent">REEL</span>
                  </div>
                  <div className="mt-1.5 h-[2px] w-full rounded-full platform-hero-reel-track overflow-hidden">
                    <div
                      key={`${activeCut}-${paused ? "p" : "r"}`}
                      className="h-full w-full platform-hero-reel-fill platform-reel-progress"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 pr-1">
                  {HERO_SCENES.map((scene, idx) => (
                    <button
                      key={scene.label}
                      type="button"
                      onClick={() => setActiveCut(idx)}
                      aria-label={`Show ${scene.label}`}
                      aria-current={idx === activeCut ? "true" : undefined}
                      className={`h-2 rounded-full cursor-pointer transition-all ${
                        idx === activeCut
                          ? "w-4 platform-hero-dot-active"
                          : "w-2 platform-hero-dot"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-4 text-[12.5px] font-mono platform-hero-muted">
              Free while in beta · No credit card needed · Built in Nepal
            </p>
          </div>
        </div>
      </section>

      {/* 2. Staggered Desktop / Swipeable Mobile Storefront Looks */}
      <ThemeTemplateStudio storeName={storeName} slug={resolvedSlug} />
    </>
  );
}
