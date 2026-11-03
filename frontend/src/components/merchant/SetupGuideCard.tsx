"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Package,
  Sparkles,
  Truck,
  CreditCard,
  Copy,
  Store,
} from "lucide-react";

export interface SetupGuideCardProps {
  storeSlug: string;
  storeName: string;
  checklist: {
    has_products: boolean;
    has_shipping: boolean;
    has_khalti: boolean;
    has_story?: boolean;
  };
}

export function SetupGuideCard({
  storeSlug,
  storeName,
  checklist,
}: SetupGuideCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 4 steps total: 1 (store created) is always true + 3 checklist items
  const steps = [
    {
      id: "store_url",
      title: "Store URL claimed",
      description: `/s/${storeSlug} is reserved and live on ShopCraft`,
      completed: true,
      actionLabel: "Visit",
      actionHref: `/s/${encodeURIComponent(storeSlug)}`,
      isExternal: true,
      icon: Store,
    },
    {
      id: "products",
      title: "Add catalog products & variants",
      description: "Set up sizes (e.g. 250g, 500g, 1kg) and optional subscription discounts",
      completed: checklist.has_products,
      actionLabel: checklist.has_products ? "Manage" : "Add product",
      actionHref: `/merchant/${encodeURIComponent(storeSlug)}/products`,
      isExternal: false,
      icon: Package,
    },
    {
      id: "shipping",
      title: "Set delivery fees & thresholds",
      description: "Configure Kathmandu Valley and Outside Valley rates plus free delivery threshold",
      completed: checklist.has_shipping,
      actionLabel: checklist.has_shipping ? "Manage" : "Set rates",
      actionHref: `/merchant/${encodeURIComponent(storeSlug)}/settings`,
      isExternal: false,
      icon: Truck,
    },
    {
      id: "payments",
      title: "Verify Khalti or COD checkout",
      description: "Test direct wallet payments or accept cash on delivery from riders",
      completed: checklist.has_khalti,
      actionLabel: checklist.has_khalti ? "Manage" : "Configure",
      actionHref: `/merchant/${encodeURIComponent(storeSlug)}/settings?tab=payments`,
      isExternal: false,
      icon: CreditCard,
    },
    {
      id: "story",
      title: "Publish your Nepal brand story",
      description: "Write your founder origin note and customize your storefront theme",
      completed: Boolean(checklist.has_story),
      actionLabel: checklist.has_story ? "Edit story" : "Write story",
      actionHref: `/merchant/${encodeURIComponent(storeSlug)}/themes`,
      isExternal: false,
      icon: Sparkles,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);
  const isFullySetup = completedCount === totalCount;

  const handleCopyStoreLink = () => {
    const fullUrl = `${window.location.origin}/s/${storeSlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xs">
      {/* Header with Progress Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-[var(--card-foreground)] flex items-center gap-1.5">
              <span>Setup Guide: Path to First Sale</span>
              {isFullySetup && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold">
                  Ready
                </span>
              )}
            </h2>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {isFullySetup
              ? "All core setup steps are finished. Share your store link on Instagram, TikTok, and WhatsApp."
              : "Complete these steps so shoppers can browse, add to bag, and pay with Khalti or COD."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-[var(--foreground)] tabular-nums">
              {completedCount} of {totalCount} completed
            </div>
            <div className="text-[10px] text-[var(--muted-foreground)] tabular-nums">
              {progressPct}% progress
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand setup guide" : "Collapse setup guide"}
            className="p-1.5 rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar (Polaris style hairline bar) */}
      <div className="w-full h-1.5 bg-[var(--secondary)] overflow-hidden">
        <div
          className="h-full bg-emerald-600 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Accordion Body */}
      {!collapsed && (
        <div className="p-4 sm:p-5 space-y-3">
          {/* Step Rows */}
          <div className="space-y-2 divide-y divide-[var(--border)]">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5 border"
                      style={{
                        backgroundColor: step.completed
                          ? "var(--st-delivered)"
                          : "var(--secondary)",
                        borderColor: step.completed
                          ? "var(--st-delivered)"
                          : "var(--border)",
                        color: step.completed ? "#FFFFFF" : "var(--muted-foreground)",
                      }}
                    >
                      {step.completed ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                    </span>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold ${
                          step.completed
                            ? "text-[var(--foreground)]"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-[11px] text-[var(--muted-foreground)] truncate sm:whitespace-normal">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={step.actionHref}
                    target={step.isExternal ? "_blank" : undefined}
                    className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[var(--foreground)] hover:underline shrink-0 ml-2 px-2 py-1 rounded hover:bg-[var(--secondary)] transition-colors"
                  >
                    <span>{step.actionLabel}</span>
                    {step.isExternal ? (
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    ) : (
                      <span>→</span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Fully Setup CTA Footer */}
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted-foreground)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Shareable Storefront Link:</span>
              <span className="font-bold text-[var(--foreground)]">
                /s/{storeSlug}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyStoreLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--secondary)] text-xs font-mono font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Store URL</span>
                  </>
                )}
              </button>

              <Link
                href={`/s/${encodeURIComponent(storeSlug)}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-mono font-medium hover:opacity-90 transition-opacity"
              >
                <span>View Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
