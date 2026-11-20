"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { PasswordlessAuthCard } from "@/components/auth/OtpInput";
import { ShopCraftMark } from "@/components/platform/ShopCraftLogo";
import {
  fetchSession,
  logoutSession,
  sanitizeRedirectTarget,
  UserProfile,
} from "@/lib/api";

function SignupLoadingSkeleton() {
  return (
    <div className="w-full max-w-md p-6 sm:p-8 bg-card border border-line rounded-2xl animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-paper-2 rounded" />
        <div className="h-4 w-64 bg-paper-2 rounded" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 w-20 bg-paper-2 rounded" />
        <div className="h-12 w-full bg-paper-2 rounded-lg" />
      </div>
      <div className="h-12 w-full bg-paper-2 rounded-lg" />
    </div>
  );
}

function SignupContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const storeNameParam = searchParams.get("name");

  // Starting from /signup defaults to the Store Setup Wizard
  const effectiveNext = nextParam || "/merchant/new";
  const destination = sanitizeRedirectTarget(effectiveNext, storeNameParam);

  const [loadingSession, setLoadingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const session = await fetchSession();
        if (!mounted) return;
        if (session.authenticated && session.user) {
          setCurrentUser(session.user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        if (mounted) setCurrentUser(null);
      } finally {
        if (mounted) setLoadingSession(false);
      }
    }

    checkAuth();

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
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 bg-paper text-ink">
      {/* Brand Icon Header */}
      <div className="mb-6 flex flex-col items-center text-center space-y-2">
        <div className="w-11 h-11 rounded-xl bg-card border border-line flex items-center justify-center">
          <ShopCraftMark className="w-7 h-7" />
        </div>
        <div>
          <span className="text-xs font-mono font-semibold tracking-widest uppercase text-ink-3">
            ShopCraft Store Setup
          </span>
        </div>
      </div>

      {loadingSession ? (
        <SignupLoadingSkeleton />
      ) : currentUser ? (
        /* Authenticated: Direct bridge into Store Creation Wizard */
        <div className="w-full max-w-md p-6 sm:p-8 bg-card border border-line rounded-2xl space-y-6 text-ink">
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-paid-bg text-paid-ink font-semibold uppercase">
              Account Active
            </span>
            <h1 className="text-xl font-bold tracking-tight pt-1 text-ink">
              Create your store
            </h1>
            <p className="text-xs text-ink-2 font-mono truncate">
              Signed in as {currentUser.email}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-line bg-paper space-y-3">
            <p className="text-xs text-ink-2 leading-relaxed">
              Your account is verified. Head straight into the store setup wizard to choose your brand name, select your design look, and publish your catalog.
            </p>
            <Link
              href={destination}
              className="w-full min-h-[48px] rounded-lg bg-btn hover:bg-btn-hover text-btn-ink text-xs font-bold font-mono transition-colors flex items-center justify-center gap-2"
            >
              <span>Launch Store Setup Wizard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/merchant"
              className="w-full min-h-[44px] rounded-lg border border-line-strong text-xs font-medium font-mono text-ink-2 hover:text-ink hover:bg-paper-2 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Go to Existing Merchant Dashboard →</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
            <Link
              href="/"
              className="min-h-[44px] inline-flex items-center text-ink-2 hover:text-ink transition-colors"
            >
              ← Back to Home
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="min-h-[44px] inline-flex items-center gap-1 text-xs font-mono text-ink-2 hover:text-[var(--sc-danger)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? "Signing out..." : "Use different account"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Unauthenticated Merchant Signup Card */
        <div className="w-full max-w-md space-y-4">
          {storeNameParam && (
            <div className="p-3 rounded-xl border border-line bg-paid-bg text-xs text-paid-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-paid-ink shrink-0" />
              <span>
                Reserving store name:{" "}
                <strong className="font-semibold">{storeNameParam}</strong>
              </span>
            </div>
          )}

          <PasswordlessAuthCard
            nextParam={effectiveNext}
            storeNameParam={storeNameParam}
            title="Create your store"
            subtitle="Enter your email to verify your account and set up your store."
            submitButtonText="Email me a code"
            onSuccess={() => {
              window.location.href = destination;
            }}
            footerContent={
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-ink-3">
                  <span>✓ Free in beta</span>
                  <span>✓ No card needed</span>
                  <span>✓ Khalti &amp; COD</span>
                </div>
                <p className="text-ink-2 pt-1">
                  Already have a ShopCraft account?{" "}
                  <Link
                    href={
                      storeNameParam
                        ? `/login?name=${encodeURIComponent(storeNameParam)}&next=${encodeURIComponent(
                            nextParam || "/merchant/new"
                          )}`
                        : nextParam
                        ? `/login?next=${encodeURIComponent(nextParam)}`
                        : "/login?next=/merchant"
                    }
                    className="font-semibold text-accent underline underline-offset-2 hover:opacity-80"
                  >
                    Log in here →
                  </Link>
                </p>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoadingSkeleton />}>
      <SignupContent />
    </Suspense>
  );
}
