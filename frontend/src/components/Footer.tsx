"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, ShieldCheck } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // 1. Staff Admin Portal: Zero consumer footer
  if (pathname === "/admin") {
    return null;
  }

  // 2. Focused Application & Funnel Pages: Clean minimal 1-line bar
  const isAppPage = pathname === "/dashboard" || pathname === "/checkout" || pathname === "/login";

  if (isAppPage) {
    return (
      <footer className="py-6 px-6 text-xs text-[#8A7966] border-t border-[#E6DEC8] bg-[#FAF8F5] mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="flex items-center gap-2 text-[#5C5042]">
            <Coffee size={14} className="text-[#A3432A]" />
            <span>© 2026 BrewMellow. 100% Direct-Trade Himalayan Coffee.</span>
          </p>
          <div className="flex gap-5 text-[11px] uppercase tracking-wider font-bold">
            <Link href="/" className="hover:text-[#1A1512] transition-colors">Storefront</Link>
            <Link href="/origins" className="hover:text-[#1A1512] transition-colors">Origins</Link>
            <Link href="/admin" className="hover:text-[#1A1512] transition-colors">Staff Portal</Link>
          </div>
        </div>
      </footer>
    );
  }

  // 3. Storefront Marketing Pages: Full 4-Column Roastery Footer
  return (
    <footer className="bg-[#1A1512] text-[#F5F2EB] pt-16 pb-12 border-t border-[#2C2420] mt-auto">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        
        {/* Brand Mission Column */}
        <div className="md:col-span-1">
          <h2 className="text-2xl font-serif font-bold mb-3 text-white flex items-center gap-2">
            BrewMellow<span className="text-[#A3432A]">.</span>
          </h2>
          <p className="text-[#8A7966] text-sm leading-relaxed mb-4">
            Elevating Himalayan specialty coffee. Micro-lots sustainably sourced from smallholder farmers in Western and Eastern Nepal.
          </p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#2C2420] text-[#E58A1F] text-[10px] uppercase tracking-widest font-bold rounded">
            <ShieldCheck size={12} /> 100% Direct-Trade Verified
          </span>
        </div>

        {/* Shop Navigation */}
        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#E58A1F] font-bold mb-5">
            Coffee Club
          </h3>
          <ul className="space-y-3.5 text-sm text-[#A89F91]">
            <li>
              <Link href="/subscribe" className="hover:text-white transition-colors">
                Personalized Subscriptions
              </Link>
            </li>
            <li>
              <Link href="/origins" className="hover:text-white transition-colors">
                Single-Origin Mountain Lots
              </Link>
            </li>
            <li>
              <Link href="/dashboard?tab=subscription" className="hover:text-white transition-colors">
                Subscriber Portal
              </Link>
            </li>
          </ul>
        </div>

        {/* Terroir & Story */}
        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#E58A1F] font-bold mb-5">
            The Terroir
          </h3>
          <ul className="space-y-3.5 text-sm text-[#A89F91]">
            <li>
              <Link href="/origins" className="hover:text-white transition-colors">
                Gulmi High Altitude (1,600m)
              </Link>
            </li>
            <li>
              <Link href="/origins" className="hover:text-white transition-colors">
                Ilam Tea-Belt Microlot (1,800m)
              </Link>
            </li>
            <li>
              <Link href="/about#story" className="hover:text-white transition-colors">
                Lalitpur Roastery Process
              </Link>
            </li>
          </ul>
        </div>

        {/* Support & Policies */}
        <div>
          <h3 className="text-xs uppercase tracking-widest text-[#E58A1F] font-bold mb-5">
            Support & Concierge
          </h3>
          <ul className="space-y-3.5 text-sm text-[#A89F91]">
            <li>
              <Link href="/dashboard?tab=returns" className="hover:text-white transition-colors">
                Doorstep Return Request
              </Link>
            </li>
            <li>
              <Link href="/about#brew-guide" className="hover:text-white transition-colors">
                Brew Guide & Brewing Ratios
              </Link>
            </li>
            <li>
              <a href="mailto:concierge@brewmellow.com" className="hover:text-white transition-colors">
                concierge@brewmellow.com
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Sub-Footer Copyright & Staff Link */}
      <div className="max-w-6xl mx-auto px-6 pt-8 border-t border-[#2C2420] flex flex-col md:flex-row justify-between items-center text-xs text-[#8A7966] gap-4">
        <p>© 2026 BrewMellow Himalayan Roasters Pvt. Ltd. Capstone Design Team 2.</p>
        <div className="flex gap-6">
          <Link href="/about#privacy" className="hover:text-[#D3C7B1] transition-colors">Privacy Policy</Link>
          <Link href="/about#terms" className="hover:text-[#D3C7B1] transition-colors">Terms of Service</Link>
          <Link href="/admin" className="hover:text-[#D3C7B1] transition-colors">Staff Portal</Link>
        </div>
      </div>
    </footer>
  );
}
