"use client";

import React from "react";

export function EcosystemBar() {
  const PARTNERS = [
    { label: "Khalti ePayment", tag: "Instant Wallet" },
    { label: "Pathao Express", tag: "Courier API" },
    { label: "Fonepay QR", tag: "Local Banking" },
    { label: "Nepal Can Move", tag: "7 Provinces" },
    { label: "Nabil & NIC Asia", tag: "Direct Settlement" },
  ];

  return (
    <div className="w-full border-y border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-950/30 py-4 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-mono text-zinc-500 dark:text-zinc-400">
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-600">
          INTEGRATED WITH
        </span>
        {PARTNERS.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="font-bold text-zinc-800 dark:text-zinc-200 font-sans">{p.label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {p.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
