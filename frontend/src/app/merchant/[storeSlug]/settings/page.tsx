"use client";

import React, { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  ExternalLink,
  Shield,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { ApiError, fetchMerchantSettings, MerchantStoreSettings } from "@/lib/api";
import { SettingsForm } from "@/components/merchant/SettingsForm";
import {
  AuditLogPanel,
  StaffPermissionsPanel,
} from "@/components/merchant/StaffAndAuditSection";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

type SettingsTabId = "general" | "payments" | "shipping" | "staff" | "audit";

const TABS: {
  id: SettingsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "general", label: "Store & Story", icon: Store },
  { id: "payments", label: "Payments & COD", icon: CreditCard },
  { id: "shipping", label: "Shipping & Domains", icon: Truck },
  { id: "staff", label: "Staff & Roles", icon: Users },
  { id: "audit", label: "Security Audit Log", icon: Shield },
];

function MerchantSettingsInner({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as SettingsTabId | null;

  const [activeTab, setActiveTab] = useState<SettingsTabId>(
    tabParam && ["general", "payments", "shipping", "staff", "audit"].includes(tabParam)
      ? tabParam
      : "general"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<MerchantStoreSettings | null>(null);

  useEffect(() => {
    if (
      tabParam &&
      ["general", "payments", "shipping", "staff", "audit"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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
        const isAuth =
          (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
          msg.includes("401") ||
          msg.includes("403") ||
          msg.toLowerCase().includes("unauthorized") ||
          msg.toLowerCase().includes("credentials");

        if (isAuth) {
          setTimeout(
            () =>
              router.replace(
                `/login?next=/merchant/${encodeURIComponent(storeSlug)}/settings`
              ),
            0
          );
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

  const handleSelectTab = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    router.replace(
      `/merchant/${encodeURIComponent(storeSlug)}/settings?tab=${tabId}`,
      { scroll: false }
    );
  };

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
          <div className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
          <div className="h-56 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
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
          <span className="font-mono text-[var(--foreground)]">{storeSlug}</span> to view or
          modify settings.
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
              Store Settings &amp; Administration
            </h1>
            {settings.member_role && (
              <span className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)] text-[10px] font-mono uppercase text-[var(--muted-foreground)]">
                {settings.member_role}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Store details, encrypted Khalti gateway, COD rules, domains, staff RBAC &amp; audit logs
            for <span className="font-mono text-[var(--foreground)]">{storeSlug}</span>
          </p>
        </div>

        <Link
          href={`/s/${encodeURIComponent(storeSlug)}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors self-start sm:self-auto"
        >
          <span>Live Storefront</span>
          <ExternalLink className="w-3 h-3 text-[var(--muted-foreground)]" />
        </Link>
      </div>

      {/* Polaris Horizontal Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border)] pb-2">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
              }`}
            >
              <TabIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      {(activeTab === "general" || activeTab === "payments" || activeTab === "shipping") && (
        <SettingsForm
          storeSlug={storeSlug}
          initialSettings={settings}
          section={activeTab}
          onSaved={(updated) => setSettings(updated)}
        />
      )}

      {activeTab === "staff" && <StaffPermissionsPanel storeSlug={storeSlug} />}

      {activeTab === "audit" && <AuditLogPanel storeSlug={storeSlug} />}
    </div>
  );
}

export default function MerchantSettingsPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
          <div className="h-56 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
        </div>
      }
    >
      <MerchantSettingsInner storeSlug={storeSlug} />
    </Suspense>
  );
}
