"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock, MapPin, Package, ShieldCheck, Sparkles, Truck, Zap } from "lucide-react";

interface DispatchEvent {
  id: string;
  timeAgo: string;
  badge: "Khalti Paid" | "COD Verified" | "Pathao Slip" | "Roast Club" | "Express Order";
  badgeColor: string;
  item: string;
  location: string;
}

const EVENTS: DispatchEvent[] = [
  {
    id: "e1",
    timeAgo: "4m ago",
    badge: "Khalti Paid",
    badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    item: "Gulmi Reserve Bourbon (250g Whole Bean) × 2",
    location: "Lazimpat, Kathmandu (Ward 03)",
  },
  {
    id: "e2",
    timeAgo: "11m ago",
    badge: "Pathao Slip",
    badgeColor: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    item: "Ilam Single-Estate Black Tea (250g Tin)",
    location: "Lakeside, Pokhara (Express Courier)",
  },
  {
    id: "e3",
    timeAgo: "22m ago",
    badge: "Express Order",
    badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    item: "Gulmi Reserve Whole Bean Coffee (500g Bag)",
    location: "Jhamsikhel, Lalitpur (Ward 02)",
  },
  {
    id: "e4",
    timeAgo: "35m ago",
    badge: "COD Verified",
    badgeColor: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    item: "KTM Heavyweight Boxy Tee (Size L)",
    location: "New Baneshwor, Kathmandu (Ward 10)",
  },
  {
    id: "e5",
    timeAgo: "48m ago",
    badge: "Khalti Paid",
    badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    item: "Organic Solukhumbu Chamomile Jar × 1",
    location: "Kupondole, Lalitpur (Ward 01)",
  },
];

export function LiveDispatchTicker() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % EVENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const event = EVENTS[activeIdx];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl border border-[#E1E3E5] dark:border-zinc-800 bg-white/80 dark:bg-[#12141C]/80 backdrop-blur-md shadow-xs transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#707070] dark:text-zinc-400 shrink-0">
          Live Dispatch:
        </span>

        <div className="flex items-center gap-2 truncate text-xs">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${event.badgeColor}`}
          >
            {event.badge}
          </span>
          <span className="font-semibold text-[#121212] dark:text-zinc-200 truncate">
            {event.item}
          </span>
          <span className="text-[#707070] dark:text-zinc-400 hidden md:inline">
            → {event.location}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-[#707070] dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#999999]" />
          <span>{event.timeAgo}</span>
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-semibold">
          7 Provinces Routing
        </span>
      </div>
    </div>
  );
}
