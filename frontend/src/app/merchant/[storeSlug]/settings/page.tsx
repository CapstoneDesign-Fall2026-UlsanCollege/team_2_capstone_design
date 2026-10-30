"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchMerchantSettings, MerchantStoreSettings } from "@/lib/api";
import { SettingsForm } from "@/components/merchant/SettingsForm";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

export default function MerchantSettingsPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<MerchantStoreSettings | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMerchantSettings(storeSlug);
        if (!mounted) return;
        setSettings(data);
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load store settings";
        if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized")) {
          router.replace(`/login?next=/merchant/${encodeURIComponent(storeSlug)}/settings`);
          return;
        }
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [storeSlug, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <div className="h-5 w-48 bg-[var(--secondary)] rounded animate-pulse" />
            <div className="h-3 w-32 bg-[var(--secondary)] rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-44 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
          <div className="h-36 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {error || "Store settings not found or access denied."}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          You must be an owner or staff member of{" "}
          <span className="font-mono text-[var(--foreground)]">{storeSlug}</span> to view or modify
          settings.
        </p>
        <div className="pt-2 flex justify-center gap-2">
          <Link
            href={`/merchant/${encodeURIComponent(storeSlug)}`}
            className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)]"
          >
            Back to Overview
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            Store Settings
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Branding, delivery rates, and Khalti payment credentials for{" "}
            <span className="font-mono text-[var(--foreground)]">{storeSlug}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            target="_blank"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors"
          >
            <span>Live Store</span>
            <span className="text-[10px]">↗</span>
          </Link>
        </div>
      </div>

      {/* Settings Form */}
      <SettingsForm
        storeSlug={storeSlug}
        initialSettings={settings}
        onSaved={(updated) => setSettings(updated)}
      />
    </div>
  );
}
