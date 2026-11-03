"use client";

import React, { useState } from "react";
import { MessageCircle, Phone, X } from "lucide-react";

export interface StorefrontFloatingWhatsAppProps {
  storeName: string;
  contactPhone?: string | null;
}

export function StorefrontFloatingWhatsApp({
  storeName,
  contactPhone,
}: StorefrontFloatingWhatsAppProps) {
  const [isOpen, setIsOpen] = useState(false);

  const phone = contactPhone?.trim() || "9801234567";
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("977")
    ? cleanPhone
    : `977${cleanPhone}`;

  const defaultMessage = encodeURIComponent(
    `Namaste! I'm browsing ${storeName} on ShopCraft and would like to ask a question.`
  );
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${defaultMessage}`;

  return (
    <aside aria-label="WhatsApp Support" className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 font-sf-body">
      {/* Popover Bubble */}
      {isOpen && (
        <div
          role="region"
          aria-label="Direct Roastery Support"
          className="mb-3 w-72 rounded-sf border border-sf-line bg-sf-surface p-4 shadow-xl text-left animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-start justify-between gap-2 border-b border-sf-line pb-2.5">
            <div>
              <p className="font-sf-display text-sm font-bold text-sf-ink">
                Direct Roastery Support
              </p>
              <p className="text-[11px] font-sf-mono text-sf-muted">
                Usually replies in 15 mins
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close WhatsApp chat bubble"
              className="p-1 rounded text-sf-muted hover:text-sf-ink cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <p className="py-2.5 text-xs text-sf-muted leading-relaxed">
            Need advice on grind size for your V60/French Press, roast dates, or Valley delivery?
          </p>

          <div className="flex flex-col gap-2 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] h-11 px-3 rounded-sf bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sf-mono font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" aria-hidden="true" />
              <span>Chat on WhatsApp</span>
            </a>

            <a
              href={`tel:+${formattedPhone}`}
              className="w-full min-h-[40px] h-10 px-3 rounded-sf border border-sf-line bg-sf-canvas hover:bg-sf-surface text-sf-ink text-xs font-sf-mono font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-sf-muted" aria-hidden="true" />
              <span>Call: +977 {cleanPhone.replace(/^977/, "")}</span>
            </a>
          </div>
        </div>
      )}

      {/* Floating Action Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chat" : "Chat with store on WhatsApp"}
        className="min-h-[48px] h-12 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center gap-2 font-sf-mono text-xs font-bold transition-all transform active:scale-95 cursor-pointer"
      >
        <MessageCircle className="w-5 h-5 fill-white text-emerald-600" aria-hidden="true" />
        <span className="hidden sm:inline">WhatsApp Help</span>
      </button>
    </aside>
  );
}
