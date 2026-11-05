"use client";

import React from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, ShoppingBag } from "lucide-react";

export function PlatformFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#0a0a0c] text-zinc-600 dark:text-zinc-400 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-xs font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 text-left">
        
        {/* Brand & Location Column (4 cols) */}
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="font-sans font-bold tracking-tight text-xl text-zinc-900 dark:text-white">
              ShopCraft
            </span>
          </div>

          <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed max-w-sm">
            ShopCraft Technologies Pvt. Ltd. — The mobile-first e-commerce platform engineered for Nepal&apos;s coffee roasters, tea estates, apparel labels, and artisan makers.
          </p>

          <div className="space-y-2 pt-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>Patan &amp; New Baneswor, Kathmandu, Nepal</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>hello@shopcraft.com.np</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>+977 (01) 420-0000</span>
            </div>
          </div>
        </div>

        {/* Column 1: Company (2 cols) */}
        <div className="md:col-span-2 space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Company
          </span>
          <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
            <li><Link href="/about" className="hover:text-zinc-900 dark:hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/origins" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Origins Ledger</Link></li>
            <li><a href="mailto:hello@shopcraft.com.np" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Contact Support</a></li>
            <li><Link href="/coming-soon" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Careers</Link></li>
          </ul>
        </div>

        {/* Column 2: Product (2 cols) */}
        <div className="md:col-span-2 space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Product
          </span>
          <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
            <li><a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Features</a></li>
            <li><a href="#workflow" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Workflow</a></li>
            <li><a href="#capabilities" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Capabilities</a></li>
            <li><a href="#pricing" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Pricing</a></li>
            <li><a href="#faq" className="hover:text-zinc-900 dark:hover:text-white transition-colors">FAQ</a></li>
          </ul>
        </div>

        {/* Column 3: Templates & Solutions (2 cols) */}
        <div className="md:col-span-2 space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Templates
          </span>
          <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
            <li><a href="#templates" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Editorial Warm</a></li>
            <li><a href="#templates" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Pahadi Botanical</a></li>
            <li><a href="#templates" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Midnight Obsidian</a></li>
            <li><Link href="/merchant/new" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Launch Wizard</Link></li>
          </ul>
        </div>

        {/* Column 4: Legal (2 cols) */}
        <div className="md:col-span-2 space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Legal
          </span>
          <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
            <li><Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/coming-soon" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Refund Policy</Link></li>
            <li><Link href="/coming-soon" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Khalti Compliance</Link></li>
          </ul>
        </div>

      </div>

      {/* Symmetrical Bottom Copyright Bar */}
      <div className="max-w-7xl mx-auto pt-10 mt-12 border-t border-zinc-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-mono">
        <div>
          © 2026 ShopCraft Technologies Pvt. Ltd. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span>Kathmandu, Nepal</span>
          <span>·</span>
          <span>100% NPR Settlement Infrastructure</span>
        </div>
      </div>
    </footer>
  );
}
