import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import { ShoppingBag, User, Menu } from "lucide-react";

export const metadata: Metadata = {
  title: "BrewMellow | Himalayan Coffee",
  description: "Boutique Himalayan Coffee Subscription",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased bg-[#F5F2EB] text-[#2C2420] min-h-screen flex flex-col font-sans">
        {/* GLOBAL NAVBAR */}
        <nav className="sticky top-0 z-50 bg-[#F5F2EB]/90 backdrop-blur-md border-b border-[#E6DEC8]">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            
            {/* Mobile Menu Icon */}
            <div className="md:hidden">
              <Menu size={24} className="text-[#2C2420]" />
            </div>

            {/* Logo */}
            <Link href="/" className="text-2xl font-serif font-bold tracking-tight text-[#1A1512]">
              BrewMellow.
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-bold text-[#5C5042]">
              <Link href="/subscribe" className="hover:text-[#1A1512] transition-colors">Subscribe</Link>
              <Link href="/origins" className="hover:text-[#1A1512] transition-colors">Our Origins</Link>
              <Link href="#" className="hover:text-[#1A1512] transition-colors">Our Story</Link>
            </div>

            {/* Icons (Account & Cart) */}
            <div className="flex items-center gap-6 text-[#2C2420]">
              <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:text-[#5C5042] transition-colors">
                <User size={16} /> Account
              </Link>
              <Link href="/checkout" className="relative hover:text-[#5C5042] transition-colors">
                <ShoppingBag size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#A3432A] rounded-full"></span>
              </Link>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* GLOBAL FOOTER */}
        <footer className="bg-[#1A1512] text-[#F5F2EB] pt-16 pb-8 border-t border-[#2C2420] mt-auto">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            <div className="md:col-span-1">
              <h2 className="text-2xl font-serif font-bold mb-4 text-white">BrewMellow.</h2>
              <p className="text-[#8A7966] text-sm leading-relaxed">
                Elevating Himalayan coffee. Sustainably sourced, meticulously roasted, and delivered fresh to your door.
              </p>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-widest text-[#5C5042] font-bold mb-6">Shop</h3>
              <ul className="space-y-4 text-sm text-[#8A7966]">
                <li><Link href="/" className="hover:text-white transition-colors">Subscriptions</Link></li>
                <li><Link href="/origins" className="hover:text-white transition-colors">Single Origins</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Brewing Gear</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-widest text-[#5C5042] font-bold mb-6">About</h3>
              <ul className="space-y-4 text-sm text-[#8A7966]">
                <li><Link href="#" className="hover:text-white transition-colors">Our Story</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Sustainability</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">The Roastery</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-widest text-[#5C5042] font-bold mb-6">Support</h3>
              <ul className="space-y-4 text-sm text-[#8A7966]">
                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 pt-8 border-t border-[#2C2420] flex flex-col md:flex-row justify-between items-center text-xs text-[#5C5042]">
            <p>© 2026 BrewMellow. Capstone Design Team 2.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-[#8A7966] transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-[#8A7966] transition-colors">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
