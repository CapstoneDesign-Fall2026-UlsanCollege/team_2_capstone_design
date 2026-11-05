"use client";

import React, { useMemo, useState } from "react";
import { formatNpr, OverviewDailyPoint } from "@/lib/api";

export interface SteepChartProps {
  series: OverviewDailyPoint[];
  mode?: "line" | "bar";
  showOrdersOverlay?: boolean;
  showTargetLine?: boolean;
  height?: number;
}

interface PlotPoint {
  x: number;
  yRev: number;
  yOrd: number;
  raw: OverviewDailyPoint;
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const tension = 0.22;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function formatAxisCompactNpr(minor: number): string {
  const rs = Math.round(minor / 100);
  if (rs === 0) return "Rs. 0";
  if (rs >= 100000) return `Rs. ${(rs / 100000).toFixed(1)}L`;
  if (rs >= 1000) return `Rs. ${(rs / 1000).toFixed(rs % 1000 === 0 ? 0 : 1)}k`;
  return `Rs. ${rs}`;
}

export function SteepChart({
  series,
  mode = "line",
  showOrdersOverlay = true,
  showTargetLine = true,
  height = 260,
}: SteepChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const safeSeries = useMemo<OverviewDailyPoint[]>(() => {
    if (series && series.length > 0) return series;
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((d, idx) => ({
      date: `day-${idx}`,
      label: d,
      revenue_minor: 0,
      orders_count: 0,
    }));
  }, [series]);

  const width = 760;
  const padLeft = 18;
  const padRight = 64;
  const padTop = 22;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const { maxRev, avgRev, points } = useMemo(() => {
    const rawMaxRev = Math.max(...safeSeries.map((s) => s.revenue_minor), 0);
    const computedMaxRev = rawMaxRev > 0 ? Math.ceil(rawMaxRev * 1.18) : 100000;
    const rawMaxOrd = Math.max(...safeSeries.map((s) => s.orders_count), 0);
    const computedMaxOrd = rawMaxOrd > 0 ? Math.max(4, Math.ceil(rawMaxOrd * 1.25)) : 5;

    const totalRev = safeSeries.reduce((acc, s) => acc + s.revenue_minor, 0);
    const computedAvg = safeSeries.length > 0 ? totalRev / safeSeries.length : 0;

    const count = safeSeries.length;
    const pts: PlotPoint[] = safeSeries.map((item, idx) => {
      const ratioX = count <= 1 ? 0.5 : idx / (count - 1);
      const x = padLeft + ratioX * plotW;
      const yRev =
        padTop + plotH - (Math.min(item.revenue_minor, computedMaxRev) / computedMaxRev) * plotH;
      const yOrd =
        padTop + plotH - (Math.min(item.orders_count, computedMaxOrd) / computedMaxOrd) * plotH;
      return { x, yRev, yOrd, raw: item };
    });

    return {
      maxRev: computedMaxRev,
      maxOrd: computedMaxOrd,
      avgRev: computedAvg,
      points: pts,
    };
  }, [safeSeries, plotW, plotH]);

  const revCurvePath = useMemo(
    () => buildSmoothPath(points.map((p) => ({ x: p.x, y: p.yRev }))),
    [points]
  );

  const revAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];
    const baseline = padTop + plotH;
    return `${revCurvePath} L ${last.x.toFixed(1)} ${baseline} L ${first.x.toFixed(1)} ${baseline} Z`;
  }, [revCurvePath, points, plotH]);

  const ordCurvePath = useMemo(
    () => buildSmoothPath(points.map((p) => ({ x: p.x, y: p.yOrd }))),
    [points]
  );

  const activeIdx = hoveredIdx !== null ? hoveredIdx : points.length - 1;
  const activePoint = points[activeIdx] || null;

  const targetY =
    avgRev > 0
      ? padTop + plotH - (Math.min(avgRev, maxRev) / maxRev) * plotH
      : padTop + plotH * 0.45;

  const yTicks = [0, 0.33, 0.66, 1];
  const labelStride = safeSeries.length > 14 ? Math.ceil(safeSeries.length / 7) : 1;

  return (
    <div className="relative w-full select-none">
      {/* Hover Readout Pill */}
      {activePoint && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
          <div className="inline-flex items-center gap-3 text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">
              {activePoint.raw.label || activePoint.raw.date}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-[var(--foreground)]">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              {formatNpr(activePoint.raw.revenue_minor)}
            </span>
            {showOrdersOverlay && (
              <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-[var(--muted-foreground)]">
                <span className="w-2 h-2 rounded-full bg-[#E89578] inline-block" />
                {activePoint.raw.orders_count}{" "}
                {activePoint.raw.orders_count === 1 ? "order" : "orders"}
              </span>
            )}
          </div>
          {avgRev > 0 && showTargetLine && (
            <span className="text-[11px] text-[var(--muted-foreground)] font-mono tabular-nums">
              Avg {formatNpr(Math.round(avgRev))}/day
            </span>
          )}
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="Store revenue and orders chart"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="steepBlueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle Horizontal Grid Lines + Right Y-Axis Ticks */}
        {yTicks.map((t) => {
          const y = padTop + plotH - t * plotH;
          const val = Math.round(t * maxRev);
          return (
            <g key={t}>
              <line
                x1={padLeft}
                y1={y}
                x2={padLeft + plotW}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text
                x={padLeft + plotW + 10}
                y={y + 3.5}
                className="fill-[var(--muted-foreground)] text-[10px] font-mono tabular-nums"
              >
                {formatAxisCompactNpr(val)}
              </text>
            </g>
          );
        })}

        {/* Optional Steep-style Soft Green Dashed Target / Average Line */}
        {showTargetLine && (
          <line
            x1={padLeft}
            y1={targetY}
            x2={padLeft + plotW}
            y2={targetY}
            stroke="#4ADE80"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            opacity="0.85"
          />
        )}

        {mode === "line" ? (
          <>
            {/* Soft Blue Area Under Revenue Curve */}
            {points.length > 1 && <path d={revAreaPath} fill="url(#steepBlueFill)" />}

            {/* Active Vertical Dashed Guide Line (Steep signature detail) */}
            {activePoint && (
              <line
                x1={activePoint.x}
                y1={activePoint.yRev}
                x2={activePoint.x}
                y2={padTop + plotH}
                stroke="#3B82F6"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.65"
              />
            )}

            {/* Secondary Orders Smooth Curve (Warm Coral) */}
            {showOrdersOverlay && points.length > 1 && (
              <path
                d={ordCurvePath}
                fill="none"
                stroke="#E89578"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            )}

            {/* Primary Revenue Smooth Curve (Steep Blue) */}
            {points.length > 1 && (
              <path
                d={revCurvePath}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.15"
                strokeLinecap="round"
              />
            )}

            {/* Secondary Curve Hollow Nodes */}
            {showOrdersOverlay &&
              points.length <= 16 &&
              points.map((pt, idx) => (
                <circle
                  key={`ord-${pt.raw.date}-${idx}`}
                  cx={pt.x}
                  cy={pt.yOrd}
                  r={hoveredIdx === idx ? 4 : 3}
                  fill="var(--card)"
                  stroke="#E89578"
                  strokeWidth="1.6"
                />
              ))}

            {/* Primary Curve Hollow Nodes */}
            {points.length <= 20 &&
              points.map((pt, idx) => {
                const isActive = activeIdx === idx;
                return (
                  <circle
                    key={`rev-${pt.raw.date}-${idx}`}
                    cx={pt.x}
                    cy={pt.yRev}
                    r={isActive ? 4.5 : 3.2}
                    fill={isActive ? "#3B82F6" : "var(--card)"}
                    stroke="#3B82F6"
                    strokeWidth="1.8"
                  />
                );
              })}
          </>
        ) : (
          /* Clean Rounded Vertical Pill Bars Mode (Steep Mobile Card Aesthetic) */
          points.map((pt, idx) => {
            const barWidth = Math.min(20, Math.max(6, (plotW / points.length) * 0.45));
            const rawBarH = padTop + plotH - pt.yRev;
            const barH = pt.raw.revenue_minor > 0 ? Math.max(8, rawBarH) : 4;
            const barY = padTop + plotH - barH;
            const isHovered = hoveredIdx === idx;
            return (
              <g key={`bar-${pt.raw.date}-${idx}`}>
                <rect
                  x={pt.x - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  rx={Math.min(4, barWidth / 2)}
                  fill={
                    pt.raw.revenue_minor > 0
                      ? isHovered
                        ? "#1D4ED8"
                        : "#2563EB"
                      : "var(--secondary)"
                  }
                />
              </g>
            );
          })
        )}

        {/* X-Axis Labels */}
        {points.map((pt, idx) => {
          if (idx % labelStride !== 0 && idx !== points.length - 1) return null;
          const shortLabel = pt.raw.label || pt.raw.date;
          return (
            <text
              key={`lbl-${pt.raw.date}-${idx}`}
              x={pt.x}
              y={padTop + plotH + 22}
              textAnchor="middle"
              className={`text-[11px] transition-colors ${
                activeIdx === idx
                  ? "fill-[var(--foreground)] font-semibold"
                  : "fill-[var(--muted-foreground)]"
              }`}
            >
              {shortLabel}
            </text>
          );
        })}

        {/* Invisible Hover Hit Columns for Smooth Scrubbing */}
        {points.map((pt, idx) => {
          const colW = points.length > 1 ? plotW / points.length : plotW;
          return (
            <rect
              key={`hit-${pt.raw.date}-${idx}`}
              x={pt.x - colW / 2}
              y={padTop}
              width={colW}
              height={plotH + 24}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoveredIdx(idx)}
            />
          );
        })}
      </svg>
    </div>
  );
}
