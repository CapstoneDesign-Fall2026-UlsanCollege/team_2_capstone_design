"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import {
  requestStorefrontOTP,
  verifyStorefrontOTP,
} from "@/lib/api";
import { emitAuthChange, useStorefrontAuth } from "@/lib/auth";
import { useAccount } from "./AccountContext";

export interface AccountSheetProps {
  storeSlug: string;
  themePreset?: string;
}

type AuthStep = "EMAIL" | "OTP" | "LOGGED_IN";

export function AccountSheet({ storeSlug, themePreset = "editorial-warm" }: AccountSheetProps) {
  const router = useRouter();
  const { isAccountOpen, closeAccount, prefillEmail } = useAccount();
  const { isAuthenticated, user, customer, refresh, signOut } = useStorefrontAuth(storeSlug);

  const [step, setStep] = useState<AuthStep>("EMAIL");
  const [email, setEmail] = useState<string>("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // When sheet opens, if prefillEmail is given, set it
  useEffect(() => {
    if (isAccountOpen) {
      setErrorMsg(null);
      if (isAuthenticated) {
        setStep("LOGGED_IN");
      } else {
        setStep("EMAIL");
        if (prefillEmail) {
          setEmail(prefillEmail);
        }
      }
    }
  }, [isAccountOpen, isAuthenticated, prefillEmail]);

  // Handle 60s cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Auto-focus first empty OTP box when entering OTP step
  useEffect(() => {
    if (step === "OTP") {
      const firstEmpty = otpDigits.findIndex((d) => !d);
      const targetIndex = firstEmpty === -1 ? 0 : firstEmpty;
      inputRefs.current[targetIndex]?.focus();
    }
  }, [step, otpDigits]);

  // Request code
  const handleRequestCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await requestStorefrontOTP(storeSlug, cleanEmail);
      setCooldownSeconds(res.resend_in_seconds || 60);
      setOtpDigits(["", "", "", "", "", ""]);
      setStep("OTP");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to send code. Please try again.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Verify code
  const handleVerifyCode = useCallback(async (codeToVerify?: string) => {
    const rawCode = codeToVerify || otpDigits.join("");
    if (rawCode.length !== 6) {
      setErrorMsg("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await verifyStorefrontOTP(storeSlug, email.trim().toLowerCase(), rawCode);
      emitAuthChange();
      await refresh();
      setStep("LOGGED_IN");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "That code didn't match or has expired.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [otpDigits, storeSlug, email, refresh]);

  // Handle individual OTP box input
  const handleOtpChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setErrorMsg(null);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are filled, automatically submit
    if (char && index === 5 && newDigits.every((d) => d.length === 1)) {
      handleVerifyCode(newDigits.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste full 6-digit code
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    setErrorMsg(null);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      handleVerifyCode(pasted);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setStep("EMAIL");
    setEmail("");
    setOtpDigits(["", "", "", "", "", ""]);
  };

  return (
    <Dialog.Root open={isAccountOpen} onOpenChange={(open) => !open && closeAccount()}>
      <Dialog.Portal>
        {/* Simple semi-transparent overlay without blur or gradient */}
        <Dialog.Overlay
          data-store-theme={themePreset}
          className="fixed inset-0 z-50 bg-[var(--ink)]/40 transition-opacity duration-200"
        />
        <Dialog.Content
          data-store-theme={themePreset}
          className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 w-full sm:max-w-md border-t sm:border-t-0 sm:border-l border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] flex flex-col justify-between max-h-[90dvh] sm:max-h-dvh overflow-hidden outline-none duration-200"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
            <div className="flex items-center gap-2.5">
              <Dialog.Title className="font-serif text-lg font-semibold tracking-tight text-[var(--ink)]">
                {step === "LOGGED_IN" ? "Your Account" : "Sign In"}
              </Dialog.Title>
            </div>

            <button
              type="button"
              onClick={closeAccount}
              aria-label="Close account sheet"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-[var(--border)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors cursor-pointer flex items-center justify-center"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <Dialog.Description className="sr-only">
            Account authentication and customer portal drawer.
          </Dialog.Description>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 rounded-lg border border-[var(--status-error-border)] bg-[var(--status-error-bg)] text-[var(--status-error-fg)] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Email Form */}
            {step === "EMAIL" && (
              <form onSubmit={handleRequestCode} className="space-y-5">
                <div className="space-y-1.5">
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-[var(--ink)]">
                    Passwordless sign-in
                  </h3>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                    Enter your email to receive a secure 6-digit verification code. No password required.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="customer-email" className="block text-xs font-medium text-[var(--ink)]">
                    Email address
                  </label>
                  <input
                    id="customer-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full min-h-[44px] rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-50 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-[11px] text-[var(--ink-2)] leading-normal flex items-center gap-1.5 justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-success-fg)] shrink-0" />
                  <span>Guest checkout is always supported without an account</span>
                </div>
              </form>
            )}

            {/* STEP 2: 6-Box OTP Input */}
            {step === "OTP" && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-[var(--ink)]">
                    Enter 6-digit code
                  </h3>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                    We sent a temporary sign-in code to{" "}
                    <strong className="text-[var(--ink)] font-semibold">{email}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("EMAIL");
                      setErrorMsg(null);
                    }}
                    className="text-xs text-[var(--ink)] underline hover:text-[var(--ink-2)] cursor-pointer"
                  >
                    Change email
                  </button>
                </div>

                {/* 6 Individual Digit Boxes */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      autoComplete={idx === 0 ? "one-time-code" : "off"}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 sm:w-12 h-12 text-center text-lg font-mono font-bold rounded-lg border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--ink)] tabular-nums"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyCode()}
                  disabled={loading || otpDigits.some((d) => !d)}
                  className="w-full min-h-[44px] rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-50 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify &amp; sign in</span>
                  )}
                </button>

                {/* Cooldown / Resend */}
                <div className="text-center pt-1">
                  {cooldownSeconds > 0 ? (
                    <p className="text-xs text-[var(--ink-2)] tabular-nums flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Resend code in {cooldownSeconds}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestCode()}
                      disabled={loading}
                      className="text-xs font-medium text-[var(--ink)] underline hover:text-[var(--ink-2)] cursor-pointer"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Signed-In Quick Portal */}
            {step === "LOGGED_IN" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--canvas)] space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--ink)] text-[var(--surface)] font-semibold text-xs flex items-center justify-center">
                      {(customer?.full_name || user?.email || "U")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--ink)] truncate">
                        {customer?.full_name || "Shopper Account"}
                      </p>
                      <p className="text-[11px] text-[var(--ink-2)] truncate font-mono">
                        {user?.email || customer?.email}
                      </p>
                    </div>
                  </div>
                  {customer?.phone && (
                    <p className="text-[11px] text-[var(--ink-2)] pt-1">
                      Phone: <span className="text-[var(--ink)] font-medium tabular-nums">{customer.phone}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeAccount();
                      router.push(`/s/${encodeURIComponent(storeSlug)}/account`);
                    }}
                    className="w-full min-h-[44px] px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-[var(--ink)] text-xs font-medium flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-[var(--ink-2)]" />
                      <span>My orders</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--ink-2)]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeAccount();
                      router.push(`/s/${encodeURIComponent(storeSlug)}/account?tab=addresses`);
                    }}
                    className="w-full min-h-[44px] px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-[var(--ink)] text-xs font-medium flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[var(--ink-2)]" />
                      <span>Saved addresses</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--ink-2)]" />
                  </button>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full min-h-[44px] rounded-lg border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--canvas)] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-[var(--ink-2)]" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
