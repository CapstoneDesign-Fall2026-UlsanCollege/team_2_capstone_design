"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, ExternalLink, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatNpr, OverviewRecentOrder } from "@/lib/api";
import { fulfillmentView, paymentView } from "@/lib/merchant-status";

export interface RecentOrdersSectionProps {
  orders: OverviewRecentOrder[];
  storeSlug: string;
}

export function RecentOrdersSection({ orders, storeSlug }: RecentOrdersSectionProps) {
  const baseHref = `/merchant/${encodeURIComponent(storeSlug)}/orders`;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Recent orders</h2>
        <Button variant="tertiary" size="sm" asChild className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)]">
          <Link href={baseHref}>
            <span>All orders</span>
            <ArrowRight className="size-3.5 ml-1" />
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="border-[var(--border)] bg-[var(--surface)]">
          <CardContent className="p-8 text-center space-y-3">
            <div className="size-10 rounded-full border border-[var(--border)] bg-[var(--canvas)] flex items-center justify-center mx-auto text-[var(--ink-2)]">
              <ShoppingBag className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--ink)]">No orders yet</p>
              <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto leading-relaxed">
                When shoppers make purchases on your live storefront, orders will appear here.
              </p>
            </div>
            <div className="pt-1">
              <Button variant="secondary" size="sm" asChild>
                <a href={`/s/${encodeURIComponent(storeSlug)}`} target="_blank" rel="noopener noreferrer">
                  <span>Visit live store</span>
                  <ExternalLink className="size-3.5 ml-1" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop & Tablet Table (sm:block) */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead className="text-right w-[110px]">Total</TableHead>
                  <TableHead className="w-[150px]">Payment</TableHead>
                  <TableHead className="w-[140px]">Fulfillment</TableHead>
                  <TableHead className="w-[70px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((ord) => {
                  const p = paymentView(ord);
                  const f = fulfillmentView(ord);
                  return (
                    <TableRow key={ord.id} className="group">
                      <TableCell className="font-semibold text-[var(--ink)]">
                        <Link href={`${baseHref}`} className="hover:underline">
                          {ord.order_number}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium text-[var(--ink)] truncate max-w-[180px]">
                        {ord.customer_name}
                      </TableCell>
                      <TableCell className="text-xs text-[var(--ink-2)]">
                        {new Date(ord.created_at).toLocaleDateString("en-NP", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[var(--ink)] tabular-nums">
                        {formatNpr(ord.total_minor)}
                      </TableCell>
                      <TableCell>
                        <Chip tone={p.tone}>{p.label}</Chip>
                      </TableCell>
                      <TableCell>
                        <Chip tone={f.tone}>{f.label}</Chip>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`${baseHref}`}
                          className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--ink-2)] group-hover:text-[var(--ink)] transition-colors"
                        >
                          <span>View</span>
                          <ChevronRight className="size-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List (sm:hidden, 44px+ tap targets) */}
          <div className="sm:hidden divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            {orders.map((ord) => {
              const p = paymentView(ord);
              const f = fulfillmentView(ord);
              return (
                <Link
                  key={ord.id}
                  href={`${baseHref}`}
                  className="flex flex-col gap-2 p-3.5 hover:bg-[var(--canvas)] transition-colors min-h-14 justify-center"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[var(--ink)] tabular-nums">
                      {ord.order_number}
                    </span>
                    <span className="text-xs font-semibold text-[var(--ink)] tabular-nums">
                      {formatNpr(ord.total_minor)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--ink-2)]">
                    <span className="truncate max-w-[200px]">{ord.customer_name}</span>
                    <span>
                      {new Date(ord.created_at).toLocaleDateString("en-NP", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Chip tone={p.tone}>{p.label}</Chip>
                    <Chip tone={f.tone}>{f.label}</Chip>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
