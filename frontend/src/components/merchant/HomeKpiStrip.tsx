"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { formatNpr } from "@/lib/api";

export interface HomeKpiData {
  salesPaidMinor: number;
  ordersCount: number;
  aovMinor: number;
  codPendingMinor: number;
  // Optional prior period deltas
  salesDeltaPct?: number | null;
  ordersDeltaPct?: number | null;
  aovDeltaPct?: number | null;
}

export interface HomeKpiStripProps {
  data: HomeKpiData;
  rangeLabel: string;
}

function formatDelta(delta?: number | null): string | null {
  if (delta === undefined || delta === null || !Number.isFinite(delta)) return null;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${Math.round(delta)}%`;
}

export function HomeKpiStrip({ data, rangeLabel }: HomeKpiStripProps) {
  const kpis = [
    {
      id: "sales_paid",
      label: "Sales (paid)",
      value: formatNpr(data.salesPaidMinor),
      delta: formatDelta(data.salesDeltaPct),
      tooltip:
        "Net revenue from paid digital transactions (Khalti) and delivered Cash on Delivery orders in this period.",
    },
    {
      id: "orders",
      label: "Orders",
      value: data.ordersCount.toLocaleString("en-IN"),
      delta: formatDelta(data.ordersDeltaPct),
      tooltip:
        "Total valid orders placed during this period, excluding cancelled and payment-failed attempts.",
    },
    {
      id: "aov",
      label: "Average order value",
      value: formatNpr(data.aovMinor),
      delta: formatDelta(data.aovDeltaPct),
      tooltip:
        "Average sales revenue per completed order (Sales / Orders) in this period.",
    },
    {
      id: "cod_to_collect",
      label: "COD to collect",
      value: formatNpr(data.codPendingMinor),
      delta: null,
      tooltip:
        "Cash collected or pending collection by courier partners. Marked as Delivered · COD upon delivery, held until remitted.",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Performance overview</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.id} className="border-[var(--border)] bg-[var(--surface)]">
            <CardContent className="p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-1 text-xs text-[var(--ink-2)]">
                <span className="font-medium truncate">{kpi.label}</span>
                <Tooltip content={kpi.tooltip} />
              </div>

              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)] tabular-nums truncate">
                  {kpi.value}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-[var(--ink-2)]">
                  {kpi.delta ? (
                    <span className="font-medium tabular-nums">{kpi.delta}</span>
                  ) : (
                    <span>—</span>
                  )}
                  <span className="truncate">vs prior {rangeLabel}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
