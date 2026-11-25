"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, Clock } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

export interface NeedsAttentionCardsProps {
  storeSlug: string;
  ordersToDispatchCount: number;
  lowStockCount?: number;
  outOfStockCount?: number;
}

export function NeedsAttentionCards({
  storeSlug,
  ordersToDispatchCount,
  lowStockCount = 0,
  outOfStockCount = 0,
}: NeedsAttentionCardsProps) {
  const baseHref = `/merchant/${encodeURIComponent(storeSlug)}/orders`;
  const inventoryAlertsCount = lowStockCount + outOfStockCount;
  const inventoryHref =
    outOfStockCount > 0 && lowStockCount === 0
      ? `/merchant/${encodeURIComponent(storeSlug)}/inventory?status=out`
      : `/merchant/${encodeURIComponent(storeSlug)}/inventory?status=low`;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Needs attention</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Orders to Dispatch (Warning tone) */}
        <Link
          href={`${baseHref}?status=new`}
          className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
        >
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-[var(--ink-2)]">Orders to dispatch</span>
              <Chip tone={ordersToDispatchCount > 0 ? "warning" : "neutral"} icon={Clock}>
                {ordersToDispatchCount > 0 ? "Awaiting dispatch" : "All dispatched"}
              </Chip>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="space-y-0.5">
                <p className="text-2xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">
                  {ordersToDispatchCount}
                </p>
                <p className="text-xs text-[var(--ink-2)]">Ready for courier handover</p>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ink-2)] group-hover:text-[var(--ink)] transition-colors">
                <span>View</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </div>
          </CardContent>
        </Link>

        {/* Inventory Alerts */}
        <Link
          href={inventoryHref}
          className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
        >
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-[var(--ink-2)]">Inventory alerts</span>
              <Chip
                tone={
                  outOfStockCount > 0
                    ? "error"
                    : lowStockCount > 0
                    ? "warning"
                    : "neutral"
                }
                icon={inventoryAlertsCount > 0 ? AlertTriangle : Boxes}
              >
                {outOfStockCount > 0
                  ? `${outOfStockCount} out of stock`
                  : lowStockCount > 0
                  ? `${lowStockCount} low stock`
                  : "Stock healthy"}
              </Chip>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="space-y-0.5">
                <p className="text-2xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">
                  {inventoryAlertsCount}
                </p>
                <p className="text-xs text-[var(--ink-2)]">
                  {inventoryAlertsCount > 0
                    ? `${lowStockCount} low · ${outOfStockCount} sold out`
                    : "Manage tracked stock levels"}
                </p>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ink-2)] group-hover:text-[var(--ink)] transition-colors">
                <span>Manage</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </div>
          </CardContent>
        </Link>
      </div>
    </div>
  );
}
