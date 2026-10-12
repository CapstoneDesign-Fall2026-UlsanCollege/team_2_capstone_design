"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Coffee, ShoppingBag, User } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  // Corporate Staff Portal has zero consumer mobile dock
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F5F2EB] border-t border-[#E6DEC8] flex justify-around items-center h-16 z-50 pb-safe select-none">
        <Link href="/" aria-label="Navigate to Home" className="flex flex-col items-center gap-1 text-[#5C5042] hover:text-[#1A1512]">
          <Home size={20} aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </Link>
        <Link href="/origins" aria-label="Explore Himalayan Origins" className="flex flex-col items-center gap-1 text-[#5C5042] hover:text-[#1A1512]">
          <Coffee size={20} aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Origins</span>
        </Link>
        <Link href="/checkout" aria-label="View Shopping Cart" className="flex flex-col items-center gap-1 text-[#5C5042] hover:text-[#1A1512] relative">
          <ShoppingBag size={20} aria-hidden="true" />
          <span className="absolute top-0 right-2 w-2 h-2 bg-[#A3432A] rounded-full"></span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Cart</span>
        </Link>
        <Link href="/dashboard" aria-label="Customer Account Portal" className="flex flex-col items-center gap-1 text-[#5C5042] hover:text-[#1A1512]">
          <User size={20} aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Account</span>
        </Link>
      </nav>

      {/* Pad bottom on mobile so content isn't obscured by sticky dock */}
      <div className="h-16 md:hidden"></div>
    </>
  );
}
