"use client";

import React, { useEffect, useRef, useState } from "react";

interface GoogleIdentityResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleIdentityResponse) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    itp_support?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
    }
  ) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let gisScriptPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;
let activeCredentialCallback: ((credential: string) => void) | null = null;

function loadGisScriptLazily(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (gisScriptPromise) {
    return gisScriptPromise;
  }

  gisScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SCRIPT_SRC}"]`
    );
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => {
          gisScriptPromise = null;
          reject(new Error("Failed to load Google Identity Services"));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisScriptPromise = null;
      reject(new Error("Failed to load Google Identity Services"));
    };
    document.head.appendChild(script);
  });

  return gisScriptPromise;
}

function ensureGisInitialized(clientId: string) {
  if (!window.google?.accounts?.id) return;
  if (initializedClientId === clientId) return;

  window.google.accounts.id.initialize({
    client_id: clientId,
    ux_mode: "popup",
    auto_select: false,
    itp_support: true,
    callback: (response: GoogleIdentityResponse) => {
      if (response?.credential && activeCredentialCallback) {
        activeCredentialCallback(response.credential);
      }
    },
  });
  initializedClientId = clientId;
}

export interface GoogleSignInButtonProps {
  /** Only loads GIS script when enabled is true (lazy on sheet/login open). */
  enabled: boolean;
  /** Design-token surface: storefront uses --border/--ink, platform uses --sc-* */
  surface: "storefront" | "platform";
  disabled?: boolean;
  onCredential: (credential: string) => void | Promise<void>;
  onError?: (message: string) => void;
}

export function GoogleSignInButton({
  enabled,
  surface,
  disabled = false,
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!enabled || !clientId) return;

    let cancelled = false;
    activeCredentialCallback = (credential: string) => {
      void onCredentialRef.current(credential);
    };

    loadGisScriptLazily()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) {
          return;
        }
        ensureGisInitialized(clientId);
        const width = Math.min(
          Math.max(containerRef.current.clientWidth || 320, 220),
          384
        );
        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width,
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, clientId]);

  if (!clientId || !enabled) {
    return null;
  }

  const isStorefront = surface === "storefront";
  const dividerBorderClass = isStorefront
    ? "border-[var(--border)]"
    : "border-[var(--sc-line)]";
  const dividerTextClass = isStorefront
    ? "text-[var(--ink-2)]"
    : "text-[var(--sc-ink-3)]";
  const frameClass = isStorefront
    ? "rounded-lg border border-[var(--border)] bg-[var(--canvas)] p-1.5"
    : "rounded-lg border border-[var(--sc-line)] bg-[var(--sc-surface)] p-1.5";

  return (
    <div
      className={`space-y-3 pt-1 ${disabled ? "pointer-events-none opacity-60" : ""}`}
      onPointerDownCapture={() => {
        activeCredentialCallback = (credential: string) => {
          void onCredentialRef.current(credential);
        };
      }}
    >
      <div className="relative flex items-center py-1">
        <div className={`flex-grow border-t ${dividerBorderClass}`} />
        <span className={`mx-3 shrink-0 text-[11px] uppercase tracking-wider ${dividerTextClass}`}>
          or
        </span>
        <div className={`flex-grow border-t ${dividerBorderClass}`} />
      </div>

      <div
        className={`${frameClass} min-h-[48px] flex items-center justify-center overflow-hidden transition-opacity ${
          ready ? "opacity-100" : "opacity-80"
        }`}
      >
        <div ref={containerRef} className="flex w-full justify-center min-h-[40px]" />
      </div>
    </div>
  );
}
