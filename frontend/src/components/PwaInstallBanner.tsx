"use client";

import { useState, useEffect } from "react";
import { Coffee, Download, X, Share, Plus, Smartphone } from "lucide-react";

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // 2. Capture native beforeinstallprompt on Chromium / Android
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem("pwa_banner_dismissed");
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 3. Fallback: Trigger install hint after 4 seconds if not installed and not dismissed
    const dismissed = localStorage.getItem("pwa_banner_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsVisible(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Instead of raw browser alert(), open native-feeling iOS bottom sheet guide
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_banner_dismissed", "true");
  };

  if (isInstalled || (!isVisible && !showIosGuide)) return null;

  return (
    <>
      {/* 1. TOP-ALIGNED INSTALL NOTIFICATION (Eliminates mobile double-dock bottom collision) */}
      {isVisible && (
        <aside
          role="region"
          aria-label="PWA Installation Prompt"
          className="fixed top-3 left-3 right-3 md:top-4 md:right-6 md:left-auto md:max-w-md z-50 bg-[#1A1512] text-[#F5F2EB] p-4 rounded-2xl shadow-2xl border border-[#3E342F] animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5F2] text-[#A3432A] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Coffee size={20} />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider font-bold text-white">
                  BrewMellow App
                </span>
                <span className="bg-[#2E6B34] text-white text-xs font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-[#A89F91] leading-relaxed mb-3">
                Install to home screen for instant micro-lot order tracking and offline roasting journal.
              </p>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="min-h-[44px] px-4 py-2 bg-white text-[#1A1512] hover:bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} /> Install App
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="min-h-[44px] px-3 py-2 text-xs text-[#A89F91] hover:text-white transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-[#8A7966] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        </aside>
      )}

      {/* 2. NATIVE-FEELING iOS BOTTOM SHEET MODAL (Replaces ugly browser alert) */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#F5F2EB] w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[#E6DEC8] p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 pb-safe">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#E6DEC8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1A1512] text-white flex items-center justify-center">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A1512]">
                    Add to Home Screen
                  </h3>
                  <p className="text-[11px] text-[#5C5042]">Apple Safari Installation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-[#5C5042] hover:text-[#1A1512] p-1.5 cursor-pointer"
                aria-label="Close installation guide"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 mb-6 text-xs text-[#2C2420]">
              <div className="flex items-start gap-3 p-3 bg-white border border-[#E6DEC8] rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#1A1512] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <p className="leading-relaxed">
                  Tap the <strong>Share icon</strong> <Share size={14} className="inline mx-1 text-[#A3432A]" /> in Safari’s bottom toolbar.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white border border-[#E6DEC8] rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#1A1512] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <p className="leading-relaxed">
                  Scroll down the share menu and select <strong>"Add to Home Screen"</strong> <Plus size={14} className="inline mx-1 text-[#A3432A]" />.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white border border-[#E6DEC8] rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#1A1512] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <p className="leading-relaxed">
                  Tap <strong>"Add"</strong> in the top-right corner. BrewMellow will launch in full standalone mode with offline access.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIosGuide(false);
                setIsVisible(false);
                localStorage.setItem("pwa_banner_dismissed", "true");
              }}
              className="w-full min-h-[48px] bg-[#1A1512] hover:bg-[#2C2420] text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-colors cursor-pointer shadow-md"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
