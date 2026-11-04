"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { PasswordlessAuthCard } from "@/components/auth/OtpInput";
import {
  fetchSession,
  logoutSession,
  sanitizeRedirectTarget,
  UserProfile,
} from "@/lib/api";

function SignupLoadingSkeleton() {
  return (
    <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-[#141416] border border-zinc-200 dark:border-white/10 rounded-2xl animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800/60 rounded" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-12 w-full bg-zinc-100 dark:bg-zinc-800/60 rounded-lg" />
      </div>
      <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
    </div>
  );
}

function SignupContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const storeNameParam = searchParams.get("name");

  // Starting from /signup ("Start for Free") defaults to the 4-step Store Setup Wizard
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
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 bg-[#FAF7F2] dark:bg-[#0d0d0e]">
      {/* Trial Header Banner */}
      <div className="mb-6 flex flex-col items-center text-center space-y-2 max-w-lg">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>14-Day Free Trial · Built for Nepal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
          Start your free trial
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
          Launch your online storefront, configure Nepal payments (Khalti &amp; COD), and sell in NPR with zero upfront cost.
        </p>
      </div>

      {loadingSession ? (
        <SignupLoadingSkeleton />
      ) : currentUser ? (
        /* Authenticated: Direct bridge into Store Creation Wizard */
        <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-[#141416] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl space-y-6 text-zinc-900 dark:text-zinc-100">
          <div className="space-y-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase">
              Account Active
            </span>
            <h2 className="text-xl font-bold tracking-tight pt-1">
              Ready to launch your store?
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
              Signed in as {currentUser.email}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] space-y-3">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Your account is verified. Head straight into the store setup wizard to choose your brand name, select your design theme, and publish your catalog.
            </p>
            <Link
              href={destination}
              className="w-full h-12 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold font-mono transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Launch Store Setup Wizard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/merchant"
              className="w-full h-10 rounded-lg border border-zinc-200 dark:border-white/10 text-xs font-medium font-mono text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Go to Existing Merchant Dashboard →</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between text-xs">
            <Link
              href="/"
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1 text-xs font-mono text-zinc-500 hover:text-red-500 transition-colors disabled:opacity-50"
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
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Reserving store name:{" "}
                <strong className="text-zinc-900 dark:text-white">{storeNameParam}</strong>
              </span>
            </div>
          )}

          <PasswordlessAuthCard
            nextParam={effectiveNext}
            storeNameParam={storeNameParam}
            title="Create your merchant account"
            subtitle="Enter your email to verify your account and start your 14-day free trial."
            submitButtonText="Create Account & Start Free →"
            onSuccess={() => {
              window.location.href = destination;
            }}
            footerContent={
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  <span>✓ No card needed</span>
                  <span>✓ 14-day trial</span>
                  <span>✓ Khalti &amp; COD</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 pt-1">
                  Already have a ShopCraft account?{" "}
                  <Link
                    href={
                      nextParam
                        ? `/login?next=${encodeURIComponent(nextParam)}`
                        : "/login?next=/merchant"
                    }
                    className="font-semibold text-zinc-950 dark:text-white underline underline-offset-2 hover:opacity-80"
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
