"use client";

import { useState, useEffect } from "react";
import { Coffee, Download, X, Sparkles } from "lucide-react";

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already in standalone mode (PWA installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // 2. Listen for the native PWA install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 3. Fallback: Show subtle reminder after 4 seconds if not installed and not dismissed
    const dismissed = localStorage.getItem("pwa_banner_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
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
      // Fallback instruction for desktop/mobile browsers without prompt event
      alert("To install BrewMellow: Tap the Share / Settings icon in your browser and select 'Add to Home Screen' or click the Install icon in the address bar.");
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_banner_dismissed", "true");
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#1A1512] text-white p-4 md:p-5 rounded-xl shadow-2xl border border-[#A3432A]/50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#FAF5F2] text-[#A3432A] flex items-center justify-center flex-shrink-0 shadow-sm">
          <Coffee size={22} />
        </div>

        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-bold text-white">Install BrewMellow PWA</span>
            <span className="bg-[#E58A1F] text-black text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">
              App
            </span>
          </div>
          <p className="text-xs text-[#A89F91] leading-relaxed mb-3">
            Add to home screen for one-tap Himalayan coffee orders, offline tracking, and delivery alerts.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1A1512] hover:bg-[#EAE4D3] text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm"
            >
              <Download size={13} /> Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-xs text-[#8A7966] hover:text-white transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>

        <button onClick={handleDismiss} className="text-[#8A7966] hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
