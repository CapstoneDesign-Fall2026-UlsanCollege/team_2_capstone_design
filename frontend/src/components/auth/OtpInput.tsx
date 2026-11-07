"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  authenticateWithGoogle,
  requestEmailOtp,
  sanitizeRedirectTarget,
  verifyEmailOtp,
} from "@/lib/api";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, onComplete, disabled = false }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    const newValue = newDigits.join("");
    onChange(newValue);

    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newValue.length === 6 && onComplete) {
      onComplete(newValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    onChange(pasted);
    const targetIndex = Math.min(pasted.length, 5);
    inputsRef.current[targetIndex]?.focus();

    if (pasted.length === 6 && onComplete) {
      onComplete(pasted);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 w-full" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of 6`}
          disabled={disabled}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-12 text-center text-lg font-mono font-medium rounded-lg border border-[var(--sc-line)] bg-[var(--sc-surface)] text-[var(--sc-ink)] tabular-nums transition-colors focus:outline-none focus:border-[var(--sc-marigold)] focus:ring-1 focus:ring-[var(--sc-marigold)] disabled:opacity-50"
        />
      ))}
    </div>
  );
}

interface PasswordlessAuthCardProps {
  initialEmail?: string;
  nextParam?: string | null;
  storeNameParam?: string | null;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  footerContent?: React.ReactNode;
}

export function PasswordlessAuthCard({
  initialEmail = "",
  nextParam,
  storeNameParam,
  onSuccess,
  title,
  subtitle,
  submitButtonText = "Send 6-digit code",
  footerContent,
}: PasswordlessAuthCardProps) {
  const [step, setStep] = useState<"email" | "otp">(initialEmail ? "otp" : "email");
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleAuthSuccess = React.useCallback(() => {
    if (onSuccess) {
      onSuccess();
    } else {
      const destination = sanitizeRedirectTarget(nextParam, storeNameParam);
      window.location.href = destination;
    }
  }, [onSuccess, nextParam, storeNameParam]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await requestEmailOtp(cleanEmail);
      if (res.dev_otp_hint) {
        setDevOtpHint(res.dev_otp_hint);
      }
      setStep("otp");
      setResendCooldown(res.resend_in_seconds ?? 60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to send sign-in code. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyEmailOtp(email.trim().toLowerCase(), code);
      handleAuthSuccess();
    } catch {
      setError("That code didn't match or expired. Request a fresh 6-digit code.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = React.useCallback(
    async (credential: string) => {
      setLoading(true);
      setError(null);
      try {
        await authenticateWithGoogle(credential);
        handleAuthSuccess();
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Unable to sign in with Google. Please try again or use email code.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  return (
    <div className="w-full max-w-md p-6 sm:p-8 bg-[var(--sc-surface)] border border-[var(--sc-line)] rounded-xl text-[var(--sc-ink)]">
      {step === "email" ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">
              {title || "Sign in to ShopCraft"}
            </h2>
            <p className="text-sm text-[var(--sc-ink-2)]">
              {subtitle || "Enter your email to receive a 6-digit sign-in code."}
            </p>
          </div>

          <div className="space-y-1 pt-2">
            <label
              htmlFor="auth-email"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2)]"
            >
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={loading}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className="w-full h-12 px-3 text-sm rounded-lg border border-[var(--sc-line)] bg-[var(--sc-surface)] text-[var(--sc-ink)] focus:outline-none focus:border-[var(--sc-marigold)] focus:ring-1 focus:ring-[var(--sc-marigold)]"
            />
            {error && <p className="text-xs text-[var(--sc-danger)] mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center font-medium rounded-lg bg-[var(--sc-ink)] text-[var(--sc-paper)] hover:opacity-95 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {loading ? "Sending code..." : submitButtonText}
          </button>

          <GoogleSignInButton
            enabled={step === "email"}
            surface="platform"
            disabled={loading}
            onCredential={handleGoogleCredential}
            onError={(msg) => setError(msg)}
          />
        </form>
      ) : (
        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">Check your email</h2>
            <p className="text-sm text-[var(--sc-ink-2)]">
              Enter the 6-digit code sent to{" "}
              <span className="font-mono text-[var(--sc-ink)]">{email}</span>.
            </p>
          </div>

          {devOtpHint && (
            <div className="p-3 text-xs font-mono rounded-lg bg-[var(--sc-marigold-soft)] border border-[var(--sc-marigold)] text-[var(--sc-ink)]">
              <strong>Dev OTP Code:</strong> {devOtpHint}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <OtpInput
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val);
                if (error) setError(null);
              }}
              onComplete={(fullCode) => handleVerifyOtp(fullCode)}
              disabled={loading}
            />
            {error && <p className="text-xs text-[var(--sc-danger)] pt-1">{error}</p>}
          </div>

          <button
            type="button"
            onClick={() => handleVerifyOtp()}
            disabled={loading || otpCode.length !== 6}
            className="w-full h-12 flex items-center justify-center font-medium rounded-lg bg-[var(--sc-ink)] text-[var(--sc-paper)] hover:opacity-95 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {loading ? "Verifying..." : "Verify & continue"}
          </button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtpCode("");
                setError(null);
              }}
              className="text-[var(--sc-ink-2)] hover:text-[var(--sc-ink)] underline transition-colors cursor-pointer"
            >
              Use a different email
            </button>

            <button
              type="button"
              disabled={loading || resendCooldown > 0}
              onClick={() => handleRequestOtp()}
              className="text-[var(--sc-ink-2)] hover:text-[var(--sc-ink)] disabled:opacity-50 underline transition-colors cursor-pointer"
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
            </button>
          </div>
        </div>
      )}

      {footerContent && (
        <div className="pt-4 mt-4 border-t border-[var(--sc-line)] text-center text-xs">
          {footerContent}
        </div>
      )}
    </div>
  );
}
