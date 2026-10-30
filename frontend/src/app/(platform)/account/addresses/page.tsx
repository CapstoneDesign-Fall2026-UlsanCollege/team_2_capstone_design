"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<DeliveryAddressItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddressItem | null>(null);

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
          router.replace("/login?next=/account/addresses");
          return;
        }

        const list = await listDeliveryAddresses();
        if (!mounted) return;
        setAddresses(list);
      } catch {
        if (!mounted) return;
        router.replace("/login?next=/account/addresses");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [router]);

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
  };

  const handleRemove = (addr: DeliveryAddressItem) => {
    // If there was already a pending deletion, execute it immediately
    if (pendingDeletion) {
      clearTimeout(pendingDeletion.timerId);
      deleteDeliveryAddress(pendingDeletion.address.id).catch(() => {});
    }

    // Optimistically remove from list
    setAddresses((prev) => prev.filter((a) => a.id !== addr.id));

    // Schedule actual deletion after 5 seconds
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
    }
    const restored = pendingDeletion.address;
    setAddresses((prev) => [restored, ...prev]);
    setPendingDeletion(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-56 bg-[var(--sc-line,#E8E8E1)] rounded" />
          <div className="h-4 w-72 bg-[var(--sc-line,#E8E8E1)]/60 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] animate-pulse" />
          <div className="h-40 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-[var(--sc-ink,#111318)]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--sc-line,#E8E8E1)] pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Delivery Addresses</h1>
          <p className="text-sm text-[var(--sc-ink-2,#4B5060)] mt-0.5">
            Addresses used for 1-tap checkout and subscription deliveries across Nepal.
          </p>
        </div>

        {addresses.length > 0 && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-11 px-4 self-start sm:self-auto flex items-center justify-center text-xs font-medium rounded-lg bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] hover:opacity-95 transition-opacity"
          >
            + Add New Address
          </button>
        )}
      </div>

      {/* Empty State per 01-UI-SPEC.md */}
      {addresses.length === 0 ? (
        <div className="max-w-md mx-auto my-12 p-8 text-center rounded-2xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold tracking-tight">No saved delivery address yet</h2>
            <p className="text-sm text-[var(--sc-ink-2,#4B5060)] leading-relaxed">
              Add your chowk and ward once so checkout takes one tap.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="w-full h-12 flex items-center justify-center font-medium rounded-lg bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] hover:opacity-95 transition-opacity"
            >
              Add delivery address
            </button>
          </div>
        </div>
      ) : (
        /* Populated Address Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-5 rounded-xl border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-paper,#FAFAF7)] text-[var(--sc-ink-2,#4B5060)]">
                    {addr.label || "Home"}
                  </span>
                  {addr.is_default && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[var(--sc-marigold-soft,#FFF4D6)] text-[var(--sc-ink,#111318)] border border-[var(--sc-marigold,#F2A900)]">
                      Default
                    </span>
                  )}
                </div>

                <h3 className="font-medium text-sm text-[var(--sc-ink,#111318)]">
                  {addr.recipient_name}
                </h3>
                <p className="font-mono text-xs text-[var(--sc-ink-2,#4B5060)] mt-0.5">
                  +977 {addr.phone}
                </p>

                <div className="mt-3 text-xs text-[var(--sc-ink-2,#4B5060)] leading-relaxed space-y-0.5">
                  <p className="text-[var(--sc-ink,#111318)] font-medium">
                    Ward {addr.ward}, {addr.street_landmark}
                  </p>
                  <p>
                    {addr.municipality}, {addr.district}
                  </p>
                  <p>{addr.province} Province, Nepal</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-[var(--sc-line,#E8E8E1)] text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(addr)}
                  className="font-medium text-[var(--sc-ink,#111318)] hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(addr)}
                  className="font-medium text-[var(--sc-danger,#B42318)] hover:underline cursor-pointer"
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

      {/* 5-second Non-blocking Undo Bar per 01-UI-SPEC.md */}
      {pendingDeletion && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-50 rounded-xl p-4 bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] shadow-lg flex items-center justify-between gap-3 text-xs"
        >
          <div>
            <p className="font-medium">Address removed</p>
            <p className="text-[var(--sc-ink-3,#8B90A0)] text-[11px] font-mono">
              Deleting in {pendingDeletion.remainingSeconds}s...
            </p>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1.5 rounded font-medium text-xs bg-[var(--sc-marigold,#F2A900)] text-[var(--sc-ink,#111318)] hover:opacity-90 transition-opacity"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
