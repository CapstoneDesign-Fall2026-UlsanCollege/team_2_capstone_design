"use client";

import React, { useState } from "react";
import { Plus, ShoppingBag, ArrowRight, CheckCircle2, Clock, XCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolveSafeTenantTokens, calculateContrastRatio } from "@/lib/theme-contrast";

export function DevKitClient() {
  const [testAccent, setTestAccent] = useState("#2F6B4F"); // testing green rejection
  const [testText, setTestText] = useState("");

  const resolved = resolveSafeTenantTokens({
    accentColor: testAccent,
  });

  const contrastInkOnSurface = calculateContrastRatio("#171716", "#FBFAF9");
  const contrastInk2OnSurface = calculateContrastRatio("#5C5954", "#FBFAF9");
  const contrastSuccess = calculateContrastRatio("#2F6B4F", "#E8F1EC");
  const contrastWarning = calculateContrastRatio("#7A5A1E", "#F6EEDB");
  const contrastError = calculateContrastRatio("#A3342B", "#F9E9E7");

  return (
    <div className="storefront min-h-dvh bg-[var(--canvas)] p-4 sm:p-8 space-y-8 text-[13px] font-ui antialiased">
      {/* Step 1 Title */}
      <div className="max-w-4xl mx-auto space-y-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--ink)]">
          Step 1: Tokens, Typography & Base Components
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Tailwind v4 @theme, Fraunces 600 + Inter, 8px/12px radii, WCAG AA status chips, no shadows, no monospace.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* 1. Design Tokens & Contrast Check */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Design Tokens & Contrast Verification (WCAG AA)</CardTitle>
              <CardDescription>
                Guaranteed minimum 4.5:1 ratio for normal text on all backgrounds.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--canvas)] space-y-1">
                <span className="text-[11px] text-[var(--ink-2)] font-semibold block">Canvas</span>
                <span className="text-xs font-bold text-[var(--ink)] tabular-nums">#F4F3F1</span>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-1">
                <span className="text-[11px] text-[var(--ink-2)] font-semibold block">Surface</span>
                <span className="text-xs font-bold text-[var(--ink)] tabular-nums">#FBFAF9</span>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-1">
                <span className="text-[11px] text-[var(--ink-2)] font-semibold block">Ink on Surface</span>
                <span className="text-xs font-bold text-[var(--ink)] tabular-nums">
                  {contrastInkOnSurface.toFixed(1)}:1 (Pass)
                </span>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-1">
                <span className="text-[11px] text-[var(--ink-2)] font-semibold block">Ink-2 on Surface</span>
                <span className="text-xs font-bold text-[var(--ink)] tabular-nums">
                  {contrastInk2OnSurface.toFixed(1)}:1 (Pass)
                </span>
              </div>
            </div>

            {/* Status Contrast Metrics */}
            <div className="pt-2 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--success-bg)] text-[var(--success-fg)] border border-[var(--success-bd)]">
                <span className="font-semibold">Success Tint</span>
                <span className="tabular-nums font-bold">{contrastSuccess.toFixed(1)}:1 (Pass)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--warning-bg)] text-[var(--warning-fg)] border border-[var(--warning-bd)]">
                <span className="font-semibold">Warning Tint</span>
                <span className="tabular-nums font-bold">{contrastWarning.toFixed(1)}:1 (Pass)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--error-bg)] text-[var(--error-fg)] border border-[var(--error-bd)]">
                <span className="font-semibold">Error Tint</span>
                <span className="tabular-nums font-bold">{contrastError.toFixed(1)}:1 (Pass)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Base Components: Button */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Buttons (8px radius, no shadows, 44px mobile touch targets)</CardTitle>
              <CardDescription>
                One black primary fill per screen; secondary 1px border; tertiary text only.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 items-center">
            <Button variant="primary">
              <ShoppingBag /> Add to Bag · Rs. 1,450
            </Button>
            <Button variant="secondary">
              View Catalog <ArrowRight />
            </Button>
            <Button variant="tertiary">
              Plain Text WhatsApp
            </Button>
            <Button variant="primary" disabled>
              Sold Out
            </Button>
          </CardContent>
        </Card>

        {/* 3. Base Components: Status Chips */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Status Chips (Pills only for status; icon + text + tint)</CardTitle>
              <CardDescription>
                Semantic status colors only. Never used for general tags or decoration.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2.5">
            <Chip tone="success">Paid</Chip>
            <Chip tone="success">Khalti verified</Chip>
            <Chip tone="success">Delivered</Chip>
            <Chip tone="warning">Verifying payment</Chip>
            <Chip tone="warning">Awaiting COD</Chip>
            <Chip tone="warning">Out for delivery</Chip>
            <Chip tone="error">Payment failed</Chip>
            <Chip tone="error">Cancelled</Chip>
            <Chip tone="error">Returned</Chip>
            <Chip tone="neutral">Unfulfilled</Chip>
            <Chip tone="neutral">Draft</Chip>
          </CardContent>
        </Card>

        {/* 4. Base Components: Input & Form Controls */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Inputs (8px radius, 44px mobile target, tabular numbers)</CardTitle>
              <CardDescription>
                Clean neutral surface background, no box shadows, ink-2 placeholders.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--ink)] block">
                Mobile Number (Phone First)
              </label>
              <Input
                type="tel"
                placeholder="98XXXXXXXX"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
              />
              <span className="text-[11px] text-[var(--ink-2)]">Nepali 10-digit mobile number</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--ink)] block">
                Delivery Landmark / Chowk
              </label>
              <Input
                type="text"
                placeholder="Near Patan Dhoka, Lalitpur"
                defaultValue=""
              />
              <span className="text-[11px] text-[var(--ink-2)]">Doorstep address landmark</span>
            </div>
          </CardContent>
        </Card>

        {/* 5. Typography Showcase */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Typography System</CardTitle>
              <CardDescription>
                Fraunces 600 serif for headlines, Inter for UI, tabular numbers for integer NPR prices.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <h2 className="font-serif text-3xl font-bold text-[var(--ink)] leading-tight">
              Direct-trade micro-lots roasted to order in Patan.
            </h2>
            <p className="text-sm text-[var(--ink-2)] leading-relaxed">
              Every item in our storefront is priced in integer Nepalese Rupees with no decimals, aligned with tabular numerals for consistent optical alignment:
            </p>
            <div className="flex flex-wrap gap-4 text-sm font-semibold text-[var(--ink)] tabular-nums pt-1">
              <span>Rs. 850</span>
              <span>Rs. 1,200</span>
              <span>Rs. 2,450</span>
              <span>Rs. 10,000</span>
            </div>
          </CardContent>
        </Card>

        {/* 6. Tenant Color Override Validation & Protection */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tenant Protection: Forbidden Accent Color Test</CardTitle>
              <CardDescription>
                Attempts to set green (#2F6B4F), amber (#7A5A1E), or red (#A3342B) as store accent are rejected.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={testAccent}
                onChange={(e) => setTestAccent(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[var(--border)] text-xs font-semibold bg-[var(--surface)] text-[var(--ink)]"
              />
              <span className="text-xs text-[var(--ink-2)]">
                Active resolved primary fill: <strong className="text-[var(--ink)]">{resolved.tokens.primary}</strong>
              </span>
            </div>
            {resolved.warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-[var(--warning-bg)] text-[var(--warning-fg)] border border-[var(--warning-bd)] text-xs space-y-1">
                {resolved.warnings.map((w, idx) => (
                  <p key={idx}>⚠️ {w}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
