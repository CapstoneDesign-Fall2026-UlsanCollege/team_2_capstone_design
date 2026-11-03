"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Plus,
  ShoppingBag,
} from "lucide-react";
import {
  deleteDeliveryAddress,
  DeliveryAddressItem,
  fetchSession,
  listDeliveryAddresses,
} from "@/lib/api";
import { AddressSheet } from "@/components/account/AddressSheet";

interface PendingDeletion {
  address: DeliveryAddressItem;
  timerId: NodeJS.Timeout;
  remainingSeconds: number;
}

export default function AddressesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-pulse">
          <div className="h-7 w-56 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-4 w-72 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
      }
    >
      <AddressesContent />
    </Suspense>
  );
}

function AddressesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<DeliveryAddressItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddressItem | null>(null);
  const [justSavedNotification, setJustSavedNotification] = useState<string | null>(null);

  // Undo removal state
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const session = await fetchSession();
        if (!mounted) return;

        if (!session.authenticated) {
          const redirectTarget = nextUrl
            ? `/login?next=${encodeURIComponent(`/account/addresses?next=${encodeURIComponent(nextUrl)}`)}`
            : "/login?next=/account/addresses";
          setTimeout(() => router.replace(redirectTarget), 0);
          return;
        }

        const list = await listDeliveryAddresses();
        if (!mounted) return;
        setAddresses(list);
      } catch {
        if (!mounted) return;
        setTimeout(() => router.replace("/login?next=/account/addresses"), 0);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [router, nextUrl]);

  // Handle countdown interval for Undo notification
  useEffect(() => {
    if (!pendingDeletion) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setPendingDeletion((prev) => {
        if (!prev) return null;
        if (prev.remainingSeconds <= 1) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          return null;
        }
        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1,
        };
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [pendingDeletion]);

  const handleOpenCreate = () => {
    setEditingAddress(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (addr: DeliveryAddressItem) => {
    setEditingAddress(addr);
    setSheetOpen(true);
  };

  const handleSaved = (saved: DeliveryAddressItem) => {
    setAddresses((prev) => {
      const exists = prev.some((a) => a.id === saved.id);
      let updated: DeliveryAddressItem[];
      if (exists) {
        updated = prev.map((a) => (a.id === saved.id ? saved : a));
      } else {
        updated = [saved, ...prev];
      }
      if (saved.is_default) {
        updated = updated.map((a) => ({
          ...a,
          is_default: a.id === saved.id,
        }));
      }
      return updated;
    });

    if (nextUrl) {
      setJustSavedNotification(
        `Address "${saved.label || "Home"}" saved! Redirecting to checkout...`
      );
      setTimeout(() => {
        router.push(nextUrl);
      }, 1200);
    } else {
      setJustSavedNotification(
        `Delivery address "${saved.label || "Home"}" saved! You can now use 1-tap checkout.`
      );
      setTimeout(() => setJustSavedNotification(null), 4000);
    }
  };

  const handleRemove = (addr: DeliveryAddressItem) => {
    if (pendingDeletion) {
      clearTimeout(pendingDeletion.timerId);
      deleteDeliveryAddress(pendingDeletion.address.id).catch(() => {});
    }

    setAddresses((prev) => prev.filter((a) => a.id !== addr.id));

    const timerId = setTimeout(() => {
      deleteDeliveryAddress(addr.id).catch(() => {});
      setPendingDeletion(null);
    }, 5000);

    setPendingDeletion({
      address: addr,
      timerId,
      remainingSeconds: 5,
    });
  };

  const handleUndo = () => {
    if (!pendingDeletion) return;
    clearTimeout(pendingDeletion.timerId);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    const restored = pendingDeletion.address;
    setAddresses((prev) => [restored, ...prev]);
    setPendingDeletion(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-56 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-4 w-72 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse" />
          <div className="h-40 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-zinc-900 dark:text-zinc-100 font-sans space-y-6">
      
      {/* 1. Breadcrumbs & Return Navigation */}
      <nav className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
        {nextUrl ? (
          <Link
            href={nextUrl}
            className="hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Checkout</span>
          </Link>
        ) : (
          <Link
            href="/"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Platform Home</span>
          </Link>
        )}
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-200 font-semibold">Saved Addresses</span>
      </nav>

      {/* 2. Header Bar with Direct CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Saved Delivery Addresses</h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your delivery locations for 1-tap checkout and subscription deliveries across Nepal.
          </p>
        </div>

        {addresses.length > 0 && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-10 px-4 self-start sm:self-auto flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Address</span>
          </button>
        )}
      </div>

      {/* 3. Success / Action Callout after saving address */}
      {justSavedNotification && (
        <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{justSavedNotification}</span>
          </div>

          {nextUrl && (
            <Link
              href={nextUrl}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
            >
              <span>Return to Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* 4. Dedicated Return to Checkout Bar (If came from Checkout) */}
      {nextUrl && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span>Checkout in progress</span>
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Your saved address will be applied at checkout.
            </p>
          </div>

          <Link
            href={nextUrl}
            className="w-full sm:w-auto h-9 px-4 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shrink-0 shadow-xs"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 5. Address List or Empty State */}
      {addresses.length === 0 ? (
        <div className="max-w-md mx-auto my-10 p-8 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mx-auto flex items-center justify-center text-zinc-500">
            <MapPin className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-bold tracking-tight">No saved delivery address yet</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Add your ward, chowk, and mobile phone once so you can complete orders across Nepal in 1 tap.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="w-full h-11 flex items-center justify-center gap-1.5 font-semibold text-xs rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Delivery Address</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 space-y-4 flex flex-col justify-between shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {addr.label || "Home"}
                  </span>
                  {addr.is_default && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Default
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {addr.recipient_name}
                </h3>
                <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  +977 {addr.phone}
                </p>

                <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-0.5">
                  <p className="text-zinc-900 dark:text-zinc-200 font-medium">
                    Ward {addr.ward}, {addr.street_landmark}
                  </p>
                  <p>
                    {addr.municipality}, {addr.district}
                  </p>
                  <p>{addr.province} Province, Nepal</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(addr)}
                  className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(addr)}
                  className="font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Sheet Drawer Modal */}
      <AddressSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialAddress={editingAddress}
        onSaved={handleSaved}
      />

      {/* 5-second Non-blocking Undo Bar */}
      {pendingDeletion && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-50 rounded-xl p-4 bg-zinc-900 text-white shadow-xl flex items-center justify-between gap-3 text-xs"
        >
          <div>
            <p className="font-medium">Address removed</p>
            <p className="text-zinc-400 text-[11px] font-mono">
              Deleting in {pendingDeletion.remainingSeconds}s...
            </p>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1.5 rounded font-bold text-xs bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
