"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, X, ShoppingBag, User, Coffee, Mountain, BookOpen, 
  ShieldCheck, LogOut, ArrowRight, Sparkles 
} from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; is_staff?: boolean } | null>(null);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Read authenticated session
  useEffect(() => {
    try {
      const saved = localStorage.getItem("demo_user");
      if (saved) {
        setUser(JSON.parse(saved));
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  }, [pathname]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem("demo_user");
    setUser(null);
    setIsOpen(false);
    window.location.href = "/login";
  };

  return (
    <>
      {/* Sticky Global Top Navigation */}
      <nav className="sticky top-0 z-40 bg-[#F5F2EB]/95 backdrop-blur-md border-b border-[#E6DEC8]">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Mobile Hamburger Button (Active 3-Line Menu) */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="md:hidden p-2 -ml-2 text-[#2C2420] hover:text-[#A3432A] transition-colors rounded-lg focus:outline-none"
            aria-label="Open Navigation Menu"
          >
            <Menu size={26} />
          </button>

          {/* Brand Logo */}
          <Link href="/" className="text-2xl font-serif font-bold tracking-tight text-[#1A1512] flex items-center gap-2">
            BrewMellow<span className="text-[#A3432A]">.</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-bold text-[#5C5042]">
            <Link 
              href="/subscribe" 
              className={`transition-colors hover:text-[#1A1512] ${pathname === "/subscribe" ? "text-[#A3432A]" : ""}`}
            >
              Subscribe
            </Link>
            <Link 
              href="/origins" 
              className={`transition-colors hover:text-[#1A1512] ${pathname === "/origins" ? "text-[#A3432A]" : ""}`}
            >
              Our Origins
            </Link>
            <Link 
              href="/about" 
              className={`transition-colors hover:text-[#1A1512] ${pathname === "/about" ? "text-[#A3432A]" : ""}`}
            >
              Our Story
            </Link>
          </div>

          {/* Right Controls: Account & Cart */}
          <div className="flex items-center gap-4 text-[#2C2420]">
            {user?.is_staff && (
              <Link 
                href="/admin" 
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1512] text-[#E58A1F] text-[10px] uppercase tracking-widest font-bold rounded hover:bg-black transition-colors"
                title="Staff Portal"
              >
                <ShieldCheck size={12} /> Staff
              </Link>
            )}
            <Link 
              href="/dashboard" 
              className="hidden md:flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:text-[#A3432A] transition-colors"
              aria-label={user ? `Account: ${user.name}` : "Account Dashboard"}
            >
              <User size={16} aria-hidden="true" />
              <span>{user ? user.name.split(" ")[0] : "Account"}</span>
            </Link>
            <Link 
              href="/checkout" 
              className="relative p-2 text-[#2C2420] hover:text-[#A3432A] transition-colors"
              aria-label="View Shopping Cart (1 item)"
              title="Cart"
            >
              <ShoppingBag size={22} aria-hidden="true" />
              <span className="sr-only">Shopping Cart</span>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#A3432A] rounded-full border-2 border-[#F5F2EB]"></span>
            </Link>
          </div>

        </div>
      </nav>

      {/* Slide-in Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-out Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-[#F5F2EB] border-r border-[#E6DEC8] shadow-2xl flex flex-col justify-between p-6 overflow-y-auto animate-in slide-in-from-left duration-300">
            
            {/* Drawer Top Header */}
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#E6DEC8]">
                <Link 
                  href="/" 
                  onClick={() => setIsOpen(false)}
                  className="text-2xl font-serif font-bold text-[#1A1512]"
                >
                  BrewMellow<span className="text-[#A3432A]">.</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-[#5C5042] hover:text-[#A3432A] transition-colors rounded-lg"
                  aria-label="Close Navigation Menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Navigation Menu Links */}
              <div className="py-6 space-y-2">
                <Link
                  href="/subscribe"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm uppercase tracking-wider font-bold transition-colors ${
                    pathname === "/subscribe"
                      ? "bg-[#1A1512] text-white"
                      : "text-[#1A1512] hover:bg-[#EAE4D3]"
                  }`}
                >
                  <Coffee size={18} className="text-[#A3432A]" />
                  <span>Coffee Club & Subscribe</span>
                </Link>

                <Link
                  href="/origins"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm uppercase tracking-wider font-bold transition-colors ${
                    pathname === "/origins"
                      ? "bg-[#1A1512] text-white"
                      : "text-[#1A1512] hover:bg-[#EAE4D3]"
                  }`}
                >
                  <Mountain size={18} className="text-[#A3432A]" />
                  <span>Our Himalayan Origins</span>
                </Link>

                <Link
                  href="/about"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm uppercase tracking-wider font-bold transition-colors ${
                    pathname === "/about"
                      ? "bg-[#1A1512] text-white"
                      : "text-[#1A1512] hover:bg-[#EAE4D3]"
                  }`}
                >
                  <BookOpen size={18} className="text-[#A3432A]" />
                  <span>Our Roastery Story</span>
                </Link>

                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm uppercase tracking-wider font-bold transition-colors ${
                    pathname === "/dashboard"
                      ? "bg-[#1A1512] text-white"
                      : "text-[#1A1512] hover:bg-[#EAE4D3]"
                  }`}
                >
                  <User size={18} className="text-[#A3432A]" />
                  <span>Customer Dashboard</span>
                </Link>

                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm uppercase tracking-wider font-bold transition-colors ${
                    pathname === "/checkout"
                      ? "bg-[#1A1512] text-white"
                      : "text-[#1A1512] hover:bg-[#EAE4D3]"
                  }`}
                >
                  <ShoppingBag size={18} className="text-[#A3432A]" />
                  <span>Cart & Checkout</span>
                </Link>
              </div>
            </div>

            {/* Drawer Bottom Session & Staff Section */}
            <div className="pt-6 border-t border-[#E6DEC8] space-y-4">
              
              {user ? (
                <div className="p-4 bg-white border border-[#E6DEC8] rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-[#1A1512]">{user.name}</p>
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 bg-[#E7F3E8] text-[#2E6B34] rounded">
                      Logged In
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A7966] mb-3 truncate">{user.email}</p>

                  <div className="flex gap-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-2 text-center text-xs uppercase tracking-wider font-bold bg-[#1A1512] text-white rounded-lg hover:bg-[#2C2420] transition-colors"
                    >
                      Portal
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="p-2 border border-[#E6DEC8] text-[#8A7966] hover:text-[#A3432A] hover:bg-[#FAF5F2] rounded-lg transition-colors"
                      title="Log Out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-4 bg-[#1A1512] text-white rounded-xl shadow-sm hover:bg-[#2C2420] transition-colors"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold">Sign In / Register</p>
                    <p className="text-[11px] text-[#A89F91]">Manage your subscription</p>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              )}

              {/* Staff Portal Shortcut */}
              <div className="text-center pt-2">
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="text-[11px] uppercase tracking-widest font-bold text-[#8A7966] hover:text-[#1A1512] inline-flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck size={13} className="text-[#A3432A]" /> Staff Operations Portal
                </Link>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
