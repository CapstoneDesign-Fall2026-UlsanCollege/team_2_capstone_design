"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  LogOut,
  Plus,
  Store as StoreIcon,
} from "lucide-react";
import { PasswordlessAuthCard } from "@/components/auth/OtpInput";
import { ShopCraftMark } from "@/components/platform/ShopCraftLogo";
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
  const wizardHref = nextParam?.startsWith("/merchant/new")
    ? destination
    : sanitizeRedirectTarget("/merchant/new", storeNameParam);

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
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 bg-paper text-ink">
      {/* Brand Icon Header */}
      <div className="mb-6 flex flex-col items-center text-center space-y-2">
        <div className="w-11 h-11 rounded-xl bg-card border border-line flex items-center justify-center">
          <ShopCraftMark className="w-7 h-7" />
        </div>
        <div>
          <span className="text-xs font-mono font-semibold tracking-widest uppercase text-ink-3">
            ShopCraft Merchant Access
          </span>
        </div>
      </div>

      {loadingSession ? (
        <AuthLoadingSkeleton />
      ) : currentUser ? (
        /* Authenticated Merchant Dashboard Chooser */
        <div className="w-full max-w-md p-6 sm:p-8 bg-card border border-line rounded-2xl space-y-6 text-ink">
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-paid-bg text-paid-ink font-semibold uppercase">
              Signed In
            </span>
            <h1 className="text-xl font-bold tracking-tight pt-1 text-ink">Welcome back</h1>
            <p className="text-xs text-ink-2 font-mono truncate">
              {currentUser.email}
            </p>
          </div>

          {loadingStores ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs font-mono text-ink-3">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span>Loading your stores...</span>
            </div>
          ) : myStores.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-mono text-ink-3 uppercase tracking-wider">
                Your Stores ({myStores.length})
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {myStores.map((store) => (
                  <Link
                    key={store.slug}
                    href={`/merchant/${encodeURIComponent(store.slug)}`}
                    className="p-3 rounded-xl border border-line bg-paper hover:border-line-strong transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-paper-2 text-ink flex items-center justify-center font-bold text-xs">
                        <StoreIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                          {store.name}
                        </h2>
                        <p className="text-[11px] font-mono text-ink-3">
                          /merchant/{store.slug}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-ink-3 group-hover:text-ink transition-colors" />
                  </Link>
                ))}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href={wizardHref}
                  className="w-full min-h-[44px] rounded-lg border border-dashed border-line-strong text-xs font-semibold font-mono text-ink-2 hover:text-ink hover:bg-paper-2 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Another Store</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-line bg-paper text-center space-y-3">
              <p className="text-sm font-medium text-ink-2">
                You don&apos;t have an active store yet.
              </p>
              <Link
                href={wizardHref}
                className="w-full min-h-[44px] rounded-lg bg-btn hover:bg-btn-hover text-btn-ink text-xs font-bold font-mono transition-colors flex items-center justify-center gap-2"
              >
                <span>Launch Your First Store</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

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
            subtitle={
              (nextParam || "").includes("/merchant/new")
                ? "Enter your email to verify your account and set up your store."
                : "Enter your email to sign in to your merchant console and manage your online stores."
            }
            submitButtonText="Email me a code"
            onSuccess={() => {
              window.location.href = destination;
            }}
            footerContent={
              <p className="text-ink-2">
                Don&apos;t have a store yet?{" "}
                <Link
                  href={
                    storeNameParam
                      ? `/signup?name=${encodeURIComponent(storeNameParam)}&next=${encodeURIComponent(
                          nextParam || "/merchant/new"
                        )}`
                      : nextParam
                      ? `/signup?next=${encodeURIComponent(nextParam)}`
                      : "/signup?next=/merchant/new"
                  }
                  className="font-semibold text-accent underline underline-offset-2 hover:opacity-80"
                >
                  Create your store →
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
