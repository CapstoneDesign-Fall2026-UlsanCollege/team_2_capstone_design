"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart2, SlidersHorizontal } from "lucide-react";
import { formatNpr, OverviewDailyPoint } from "@/lib/api";
import { Button } from "@/components/ui/button";

export interface SalesBarChartProps {
  series: OverviewDailyPoint[];
  storeSlug: string;
  totalOrdersInRange: number;
  totalSalesMinor: number;
  rangeLabel: string;
}

/** Round up to clean, human-friendly increments (e.g. 1k, 2k, 5k, 10k, 20k, 50k). */
function computeNiceScale(rawMaxMinor: number): { maxMinor: number; ticks: number[] } {
  const rs = Math.max(1000, Math.round(rawMaxMinor / 100));
  const magnitude = Math.pow(10, Math.floor(Math.log10(rs)));
  const normalized = rs / magnitude;

  let niceMultiplier = 2;
  if (normalized <= 1) niceMultiplier = 1;
  else if (normalized <= 2) niceMultiplier = 2;
  else if (normalized <= 5) niceMultiplier = 5;
  else niceMultiplier = 10;

  const niceMaxRs = Math.max(3000, niceMultiplier * magnitude);
  const stepRs = niceMaxRs / 3;
  const ticks = [0, Math.round(stepRs), Math.round(stepRs * 2), niceMaxRs];
  return {
    maxMinor: niceMaxRs * 100,
    ticks,
  };
}

function formatTick(rs: number): string {
  if (rs === 0) return "0";
  if (rs >= 100000) return `${Math.round(rs / 100000)}L`;
  if (rs >= 1000) return `${Math.round(rs / 1000)}k`;
  return `${rs}`;
}

export function SalesBarChart({
  series,
  storeSlug,
  totalOrdersInRange,
  totalSalesMinor,
  rangeLabel,
}: SalesBarChartProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [showTarget, setShowTarget] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  // Close popover on outside click or Escape key
  useEffect(() => {
    if (!optionsOpen) return;
    const handleDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOptionsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [optionsOpen]);

  // If fewer than 5 orders in range, show a compact summary instead of a large empty chart
  const isCompact = totalOrdersInRange < 5;

  const safeSeries = useMemo(() => {
    if (series && series.length > 0) return series;
    return [
      { date: "day-1", label: "Day 1", revenue_minor: 0, orders_count: 0 },
      { date: "day-2", label: "Day 2", revenue_minor: 0, orders_count: 0 },
      { date: "day-3", label: "Day 3", revenue_minor: 0, orders_count: 0 },
      { date: "day-4", label: "Day 4", revenue_minor: 0, orders_count: 0 },
      { date: "day-5", label: "Day 5", revenue_minor: 0, orders_count: 0 },
      { date: "day-6", label: "Day 6", revenue_minor: 0, orders_count: 0 },
      { date: "day-7", label: "Day 7", revenue_minor: 0, orders_count: 0 },
    ];
  }, [series]);

  const rawMax = Math.max(...safeSeries.map((s) => s.revenue_minor), 0);
  const { maxMinor, ticks } = useMemo(() => computeNiceScale(rawMax), [rawMax]);

  // Today identifier (last item in series represents the current day)
  const todayIdx = safeSeries.length - 1;

  // Chart coordinates
  const height = 240;
  const width = 760;
  const padLeft = 40;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 32;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const barCount = safeSeries.length;
  const slotW = plotW / barCount;
  const barW = Math.max(12, Math.min(36, slotW * 0.58));

  // Target line calculation (daily target based on average or baseline)
  const avgRevMinor = safeSeries.length > 0 ? totalSalesMinor / safeSeries.length : 0;
  const targetY = padTop + plotH - (Math.min(avgRevMinor, maxMinor) / maxMinor) * plotH;

  return (
    <div className="space-y-3">
      {/* Chart Header: Title + Popover controls + Full Report Link */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            {safeSeries.length > 7 ? "Sales · Last 14 days" : "Sales"}
          </h2>
          <span className="text-xs text-[var(--ink-2)] tabular-nums">
            {formatNpr(totalSalesMinor)} in {rangeLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Controls Popover button */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={optionsOpen}
              aria-controls={popoverId}
              onClick={() => setOptionsOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--canvas)] text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              <span>Controls</span>
            </button>

            {optionsOpen && (
              <div
                id={popoverId}
                role="dialog"
                aria-label="Chart controls"
                className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 text-xs text-[var(--ink)] shadow-none space-y-2 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="font-semibold text-xs border-b border-[var(--border)] pb-1.5 text-[var(--ink)]">
                  Chart display
                </div>

                <label className="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-[var(--canvas)] cursor-pointer select-none">
                  <span className="text-[13px] text-[var(--ink)]">Target average</span>
                  <input
                    type="checkbox"
                    checked={showTarget}
                    onChange={(e) => setShowTarget(e.target.checked)}
                    className="size-4 rounded accent-[var(--ink)] cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

          <Button variant="tertiary" size="sm" asChild className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)]">
            <Link href={`/merchant/${encodeURIComponent(storeSlug)}/analytics`}>
              <span>Full report</span>
              <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Chart Body or Compact Summary (< 5 orders) */}
      {isCompact ? (
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-3">
          <div className="size-10 rounded-full border border-[var(--border)] bg-[var(--canvas)] flex items-center justify-center mx-auto text-[var(--ink-2)]">
            <BarChart2 className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--ink)]">
              {totalOrdersInRange === 0
                ? "No sales data in this period"
                : `${totalOrdersInRange} order${totalOrdersInRange === 1 ? "" : "s"} (${formatNpr(totalSalesMinor)}) in this period`}
            </p>
            <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto leading-relaxed">
              Detailed daily bar charts activate automatically once your store receives 5 or more orders in the selected period.
            </p>
          </div>
          <div className="pt-1 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" asChild>
              <a href={`/s/${encodeURIComponent(storeSlug)}`} target="_blank" rel="noopener noreferrer">
                Share live store
              </a>
            </Button>
            <Button variant="tertiary" size="sm" asChild>
              <Link href={`/merchant/${encodeURIComponent(storeSlug)}/orders`}>
                View all orders
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4 overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-[240px] select-none overflow-visible"
            aria-label="Daily sales bar chart"
          >
            {/* Horizontal Grid lines + Y-axis Clean Ticks */}
            {ticks.map((t) => {
              const y = padTop + plotH - (t / (maxMinor / 100)) * plotH;
              return (
                <g key={t}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeDasharray={t === 0 ? "none" : "3 3"}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="var(--ink-2)"
                    className="tabular-nums"
                  >
                    {formatTick(t)}
                  </text>
                </g>
              );
            })}

            {/* Optional Target Line */}
            {showTarget && avgRevMinor > 0 && (
              <g>
                <line
                  x1={padLeft}
                  y1={targetY}
                  x2={width - padRight}
                  y2={targetY}
                  stroke="var(--ink-2)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={width - padRight - 4}
                  y={targetY - 5}
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--ink-2)"
                  className="font-medium"
                >
                  Avg {formatNpr(avgRevMinor)}
                </text>
              </g>
            )}

            {/* Bars: near-black, today highlighted, clean geometry */}
            {safeSeries.map((item, idx) => {
              const xCenter = padLeft + idx * slotW + slotW / 2;
              const barX = xCenter - barW / 2;
              const barH = maxMinor > 0 ? (item.revenue_minor / maxMinor) * plotH : 0;
              const barY = padTop + plotH - barH;
              const isToday = idx === todayIdx;
              const isHovered = idx === hoveredIdx;

              // Near-black bars (#171716); today highlighted with solid var(--ink); prior bars slightly softer
              const fillColor = isToday
                ? "var(--ink)"
                : isHovered
                ? "var(--primary-hover, #2E2D2B)"
                : "#242321";

              return (
                <g
                  key={item.date || idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible broad hit box for easy hover */}
                  <rect
                    x={padLeft + idx * slotW}
                    y={padTop}
                    width={slotW}
                    height={plotH}
                    fill="transparent"
                  />

                  {/* Near-black bar with rounded top corners */}
                  {barH > 0 ? (
                    <rect
                      x={barX}
                      y={barY}
                      width={barW}
                      height={barH}
                      rx="3"
                      fill={fillColor}
                      className="transition-colors duration-150"
                    />
                  ) : (
                    // Subtle baseline pill if revenue is 0
                    <rect
                      x={barX}
                      y={padTop + plotH - 2}
                      width={barW}
                      height={2}
                      rx="1"
                      fill="var(--border)"
                    />
                  )}

                  {/* Today Highlight indicator dot */}
                  {isToday && (
                    <circle
                      cx={xCenter}
                      cy={barH > 0 ? barY - 6 : padTop + plotH - 8}
                      r="2.5"
                      fill="var(--ink)"
                    />
                  )}

                  {/* X-axis date label */}
                  <text
                    x={xCenter}
                    y={height - padBottom + 16}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isToday ? "600" : "400"}
                    fill={isToday ? "var(--ink)" : "var(--ink-2)"}
                  >
                    {isToday ? "Today" : item.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip card */}
          {hoveredIdx !== null && safeSeries[hoveredIdx] && (
            <div
              className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink)] shadow-none flex items-center gap-3 tabular-nums"
            >
              <span className="font-medium text-[var(--ink-2)]">
                {safeSeries[hoveredIdx].label}
                {hoveredIdx === todayIdx ? " (Today)" : ""}:
              </span>
              <span className="font-semibold text-[var(--ink)]">
                {formatNpr(safeSeries[hoveredIdx].revenue_minor)}
              </span>
              <span className="text-[var(--ink-2)]">
                {safeSeries[hoveredIdx].orders_count} order{safeSeries[hoveredIdx].orders_count === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
