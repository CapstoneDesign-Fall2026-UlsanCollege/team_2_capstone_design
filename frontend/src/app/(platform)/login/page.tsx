"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PasswordlessAuthCard } from "@/components/auth/OtpInput";
import {
  fetchSession,
  logoutSession,
  sanitizeRedirectTarget,
  UserProfile,
} from "@/lib/api";

function AuthLoadingSkeleton() {
  return (
    <div className="w-full max-w-md p-6 sm:p-8 bg-[var(--sc-surface,#FFFFFF)] border border-[var(--sc-line,#E8E8E1)] rounded-xl animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-[var(--sc-line,#E8E8E1)] rounded" />
        <div className="h-4 w-64 bg-[var(--sc-line,#E8E8E1)]/60 rounded" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 w-20 bg-[var(--sc-line,#E8E8E1)] rounded" />
        <div className="h-12 w-full bg-[var(--sc-line,#E8E8E1)]/40 rounded-lg" />
      </div>
      <div className="h-12 w-full bg-[var(--sc-line,#E8E8E1)] rounded-lg" />
    </div>
  );
}

function AuthContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isSignup = pathname === "/signup";
  const nextParam = searchParams.get("next");
  const storeNameParam = searchParams.get("name");

  const [loadingSession, setLoadingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const destination = sanitizeRedirectTarget(nextParam, storeNameParam);

  useEffect(() => {
    let mounted = true;
    fetchSession()
      .then((res) => {
        if (!mounted) return;
        if (res.authenticated && res.user) {
          setCurrentUser(res.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        if (mounted) setCurrentUser(null);
      })
      .finally(() => {
        if (mounted) setLoadingSession(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutSession();
      setCurrentUser(null);
    } catch {
      // Ignored
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] flex flex-col items-center justify-center p-4 sm:p-6 bg-[var(--sc-paper,#FAFAF7)]">
      {storeNameParam && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-xs text-[var(--sc-ink-2,#4B5060)]">
          <span
            className="w-2 h-2 rounded-full bg-[var(--sc-marigold,#F2A900)]"
            aria-hidden="true"
          />
          <span>
            Launching <strong className="text-[var(--sc-ink,#111318)]">{storeNameParam}</strong>
          </span>
        </div>
      )}

      {loadingSession ? (
        <AuthLoadingSkeleton />
      ) : currentUser ? (
        <div className="w-full max-w-md p-6 sm:p-8 bg-[var(--sc-surface,#FFFFFF)] border border-[var(--sc-line,#E8E8E1)] rounded-xl space-y-5 text-[var(--sc-ink,#111318)]">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">Already signed in</h2>
            <p className="text-sm text-[var(--sc-ink-2,#4B5060)]">
              Signed in as{" "}
              <span className="font-mono text-[var(--sc-ink,#111318)] font-medium">
                {currentUser.email}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = destination;
            }}
            className="w-full h-12 flex items-center justify-center font-medium rounded-lg bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] hover:opacity-95 transition-opacity"
          >
            Continue
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full h-10 flex items-center justify-center text-xs font-mono text-[var(--sc-ink-2,#4B5060)] hover:text-[var(--sc-ink,#111318)] transition-colors disabled:opacity-50"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      ) : (
        <PasswordlessAuthCard
          nextParam={nextParam}
          storeNameParam={storeNameParam}
          title={isSignup ? "Create your ShopCraft account" : "Sign in to ShopCraft"}
          subtitle={
            isSignup
              ? "Enter your email to create an account and get your store live."
              : "Enter your email to receive a 6-digit sign-in code."
          }
          onSuccess={() => {
            window.location.href = destination;
          }}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <AuthContent />
    </Suspense>
  );
}
