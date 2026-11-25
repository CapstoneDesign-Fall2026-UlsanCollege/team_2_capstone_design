"use client";

import React, { useEffect, useRef, useState } from "react";

interface PlatformRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

export function PlatformReveal({
  children,
  className = "",
  delayMs = 0,
}: PlatformRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealState, setRevealState] = useState<"idle" | "pending" | "visible">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      return;
    }

    const rect = el.getBoundingClientRect();
    // Elements already near/inside the viewport stay immediately visible so SSR & LCP never wait.
    if (rect.top <= window.innerHeight * 0.96) {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      setRevealState("pending");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealState("visible");
          observer.disconnect();
        }
      },
      {
        rootMargin: "40px 0px -32px 0px",
        threshold: 0.06,
      }
    );

    observer.observe(el);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-reveal-state={revealState}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`platform-reveal ${className}`}
    >
      {children}
    </div>
  );
}
