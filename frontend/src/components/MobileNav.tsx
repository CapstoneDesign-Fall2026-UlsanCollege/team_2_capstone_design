"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Coffee, ShoppingBag, User } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  // Hide mobile dock in corporate staff portal
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    { href: "/", label: "Home", icon: Home, exact: true },
    { href: "/origins", label: "Origins", icon: Coffee, exact: false },
    { href: "/checkout", label: "Cart", icon: ShoppingBag, exact: false, badge: true },
    { href: "/dashboard", label: "Account", icon: User, exact: false },
  ];

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F5F2EB]/95 backdrop-blur-md border-t border-[#E6DEC8] z-40 select-none pb-safe"
      >
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={`Navigate to ${item.label}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex-1 min-h-[48px] min-w-[48px] flex flex-col items-center justify-center gap-1 transition-colors relative cursor-pointer ${
                  isActive
                    ? "text-[#A3432A] font-bold"
                    : "text-[#5C5042] hover:text-[#1A1512]"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    size={20}
                    className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
                    aria-hidden="true"
                  />
                  {item.badge && (
                    <span
                      aria-label="Items in cart"
                      className="absolute -top-0.5 -right-1.5 w-2 h-2 bg-[#A3432A] rounded-full ring-2 ring-[#F5F2EB]"
                    />
                  )}
                </div>
                <span className="text-[11px] uppercase tracking-wider leading-none">
                  {item.label}
                </span>

                {/* Subtle active hairline indicator */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#A3432A] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer to prevent page content from being obscured by sticky dock and safe area */}
      <div className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] md:hidden" aria-hidden="true" />
    </>
  );
}
