"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

const linkClass = "hover:text-zinc-900 dark:hover:text-white transition-colors";

export function PlatformFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#0a0a0c] text-zinc-600 dark:text-zinc-400 py-10 px-4 sm:px-6 lg:px-8 text-xs font-sans">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-lg text-zinc-900 dark:text-white">
            ShopCraft
          </span>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <li><Link href="/about" className={linkClass}>About</Link></li>
          <li><Link href="/privacy" className={linkClass}>Privacy</Link></li>
          <li><Link href="/terms" className={linkClass}>Terms</Link></li>
          <li><a href="mailto:hello@shopcraft.me" className={linkClass}>hello@shopcraft.me</a></li>
        </ul>
      </div>

      <p className="max-w-5xl mx-auto mt-8 pt-6 border-t border-zinc-200 dark:border-white/5 text-[11px] text-zinc-500 text-center sm:text-left">
        © 2026 ShopCraft. A capstone project, built in Nepal. Free while in beta.
      </p>
    </footer>
  );
}
