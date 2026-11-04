"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  LogOut,
  Plus,
  ShoppingBag,
  Store as StoreIcon,
} from "lucide-react";
import { PasswordlessAuthCard } from "@/components/auth/OtpInput";
import {
  fetchMyStores,
  fetchSession,
  logoutSession,
  sanitizeRedirectTarget,
  MerchantStoreMembership,
  UserProfile,
} from "@/lib/api";

function AuthLoadingSkeleton() {
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

function LoginContent() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const storeNameParam = searchParams.get("name");

  const [loadingSession, setLoadingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [myStores, setMyStores] = useState<MerchantStoreMembership[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const destination = sanitizeRedirectTarget(nextParam || "/merchant", storeNameParam);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const session = await fetchSession();
        if (!mounted) return;

        if (session.authenticated && session.user) {
          setCurrentUser(session.user);
          setLoadingStores(true);
          try {
            const storesRes = await fetchMyStores();
            if (mounted) {
              setMyStores(storesRes.stores || []);
            }
          } catch {
            if (mounted) setMyStores([]);
          } finally {
            if (mounted) setLoadingStores(false);
          }
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
      setMyStores([]);
    } catch {
      // Ignored
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 bg-[#FAF7F2] dark:bg-[#0d0d0e]">
      {/* Brand Icon Header */}
      <div className="mb-6 flex flex-col items-center text-center space-y-2">
        <div className="w-11 h-11 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold shadow-md">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
            ShopCraft Merchant Access
          </span>
        </div>
      </div>

      {loadingSession ? (
        <AuthLoadingSkeleton />
      ) : currentUser ? (
        /* Authenticated Merchant Dashboard Chooser */
        <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-[#141416] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl space-y-6 text-zinc-900 dark:text-zinc-100">
          <div className="space-y-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase">
              Signed In
            </span>
            <h2 className="text-xl font-bold tracking-tight pt-1">Welcome back</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
              {currentUser.email}
            </p>
          </div>

          {loadingStores ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs font-mono text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Loading your stores...</span>
            </div>
          ) : myStores.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Your Stores ({myStores.length})
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {myStores.map((store) => (
                  <Link
                    key={store.slug}
                    href={`/merchant/${encodeURIComponent(store.slug)}`}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] hover:border-zinc-400 dark:hover:border-white/20 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
                        <StoreIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {store.name}
                        </h4>
                        <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          /merchant/{store.slug}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                  </Link>
                ))}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/merchant/new"
                  className="w-full h-11 rounded-lg border border-dashed border-zinc-300 dark:border-white/20 text-xs font-semibold font-mono text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Another Store</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02] text-center space-y-3">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                You don&apos;t have an active store yet.
              </p>
              <Link
                href="/merchant/new"
                className="w-full h-11 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold font-mono transition-all hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span>Launch Your First Store</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

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
              <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Dedicated Merchant Login Card */
        <div className="w-full max-w-md">
          <PasswordlessAuthCard
            nextParam={nextParam || "/merchant"}
            storeNameParam={storeNameParam}
            title="Log in to ShopCraft"
            subtitle="Enter your email to sign in to your merchant console and manage your online stores."
            submitButtonText="Sign in with 6-digit code →"
            onSuccess={() => {
              window.location.href = destination;
            }}
            footerContent={
              <p className="text-zinc-600 dark:text-zinc-400">
                Don&apos;t have a store yet?{" "}
                <Link
                  href={
                    nextParam
                      ? `/signup?next=${encodeURIComponent(nextParam)}`
                      : "/signup?next=/merchant/new"
                  }
                  className="font-semibold text-zinc-950 dark:text-white underline underline-offset-2 hover:opacity-80"
                >
                  Start 14-day free trial →
                </Link>
              </p>
            }
          />
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoadingSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}
