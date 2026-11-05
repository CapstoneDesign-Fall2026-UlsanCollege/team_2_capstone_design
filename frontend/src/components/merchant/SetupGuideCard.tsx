"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface SetupGuideCardProps {
  storeSlug: string;
  checklist: {
    has_products: boolean;
    has_shipping: boolean;
    has_khalti: boolean;
    has_story?: boolean;
  };
  onQuickAddProduct?: () => void;
}

export function SetupGuideCard({
  storeSlug,
  checklist,
  onQuickAddProduct,
}: SetupGuideCardProps) {
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const baseHref = `/merchant/${encodeURIComponent(storeSlug)}`;

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(`shopcraft_setup_dismissed_${storeSlug}`);
      if (isDismissed === "true") setDismissed(true);
    } catch {
      // LocalStorage unavailable
    }
  }, [storeSlug]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(`shopcraft_setup_dismissed_${storeSlug}`, "true");
    } catch {
      // Ignore
    }
  };

  const steps = useMemo(() => {
    return [
      {
        id: "store_url",
        title: "Store URL claimed",
        description: `/s/${storeSlug} is reserved and live`,
        done: true,
        actionLabel: "View store",
        href: `/s/${encodeURIComponent(storeSlug)}`,
        external: true,
      },
      {
        id: "products",
        title: "Add catalog products & variants",
        description: "Add items, product photos, weights, and NPR prices",
        done: Boolean(checklist.has_products),
        actionLabel: "Add product",
        onAction: onQuickAddProduct,
        href: `${baseHref}/products`,
      },
      {
        id: "shipping",
        title: "Set delivery fees & thresholds",
        description: "Configure Kathmandu Valley and Outside Valley rates plus free delivery threshold",
        done: Boolean(checklist.has_shipping),
        actionLabel: "Set delivery rates",
        href: `${baseHref}/settings?tab=shipping`,
      },
      {
        id: "payments",
        title: "Configure Khalti & Cash on Delivery",
        description: "Verify digital wallet credentials and enable Cash on Delivery checkout",
        done: Boolean(checklist.has_khalti),
        actionLabel: "Configure payments",
        href: `${baseHref}/settings?tab=payments`,
      },
      {
        id: "story",
        title: "Publish your brand story & theme",
        description: "Add your store tagline, founder note, and select your storefront editorial theme",
        done: Boolean(checklist.has_story),
        actionLabel: "Customize theme",
        href: `${baseHref}/themes`,
      },
    ];
  }, [checklist, storeSlug, baseHref, onQuickAddProduct]);

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const isAllDone = completedCount >= totalCount;

  // Next unfinished step
  const nextStep = steps.find((s) => !s.done);

  // Hidden at 5/5 or when dismissed
  if (isAllDone || dismissed) {
    return null;
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header: Progress + Dismiss button */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--ink)]">Setup guide</h2>
              <span className="text-xs font-medium text-[var(--ink-2)] tabular-nums">
                {completedCount} of {totalCount} done
              </span>
            </div>
            <p className="text-[13px] text-[var(--ink-2)]">
              Complete these steps to launch and optimize your store.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="tertiary"
              size="sm"
              onClick={handleDismiss}
              className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)]"
            >
              <X className="size-3.5 mr-1" aria-hidden="true" />
              <span>Dismiss</span>
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-[var(--canvas)] border border-[var(--border)] overflow-hidden">
          <div
            className="h-full bg-[var(--ink)] transition-all duration-300"
            style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
          />
        </div>

        {/* Prominent Next Step */}
        {nextStep && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink)]">
                  {steps.findIndex((s) => s.id === nextStep.id) + 1}
                </span>
                <span className="text-[13px] font-semibold text-[var(--ink)]">{nextStep.title}</span>
              </div>
              <p className="text-xs text-[var(--ink-2)] pl-7">{nextStep.description}</p>
            </div>

            {nextStep.onAction ? (
              <Button size="sm" onClick={nextStep.onAction} className="shrink-0 self-start sm:self-center">
                {nextStep.actionLabel}
              </Button>
            ) : nextStep.href ? (
              <Button size="sm" asChild className="shrink-0 self-start sm:self-center">
                <Link href={nextStep.href} target={nextStep.external ? "_blank" : undefined}>
                  {nextStep.actionLabel}
                </Link>
              </Button>
            ) : null}
          </div>
        )}

        {/* Toggleable Full Step List */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <span>{expanded ? "Hide all steps" : `View all ${totalCount} steps`}</span>
            <ChevronRight
              className={`size-3.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              aria-hidden="true"
            />
          </button>

          {expanded && (
            <div className="mt-3 divide-y divide-[var(--border)] border-t border-[var(--border)]">
              {steps.map((st, idx) => (
                <div key={st.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`size-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        st.done
                          ? "bg-[var(--success-bg)] text-[var(--success-fg)] border border-[var(--success-bd)]"
                          : "border border-[var(--border)] bg-[var(--canvas)] text-[var(--ink-2)]"
                      }`}
                    >
                      {st.done ? <Check className="size-3 stroke-[2.5]" /> : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[13px] ${st.done ? "text-[var(--ink-2)] line-through" : "font-medium text-[var(--ink)]"}`}>
                        {st.title}
                      </p>
                      <p className="text-xs text-[var(--ink-2)] truncate">{st.description}</p>
                    </div>
                  </div>

                  {!st.done && (
                    st.onAction ? (
                      <Button variant="secondary" size="sm" onClick={st.onAction}>
                        {st.actionLabel}
                      </Button>
                    ) : st.href ? (
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={st.href} target={st.external ? "_blank" : undefined}>
                          {st.actionLabel}
                        </Link>
                      </Button>
                    ) : null
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
