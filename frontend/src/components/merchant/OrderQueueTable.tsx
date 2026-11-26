"use client";

import React from "react";
import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { formatNpr, OrderDetail } from "@/lib/api";
import { orderTerminalActionView, paymentView } from "@/lib/merchant-status";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface OrderQueueTableProps {
  orders: OrderDetail[];
  onSelectOrder: (order: OrderDetail) => void;
  onQuickAdvance: (order: OrderDetail) => void;
}

function getRelativeTime(isoDate: string): string {
  try {
    const now = new Date().getTime();
    const then = new Date(isoDate).getTime();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return "Recent";
  }
}

function renderActionCell(
  order: OrderDetail,
  onQuickAdvance: (order: OrderDetail) => void
) {
  const statusUpper = order.status.toUpperCase();
  const terminalAction = orderTerminalActionView(order);

  if (statusUpper === "CONFIRMED" || statusUpper === "PAID") {
    return (
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => onQuickAdvance(order)}
      >
        Pack
      </Button>
    );
  }
  if (statusUpper === "PROCESSING" || statusUpper === "PACKED") {
    return (
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => onQuickAdvance(order)}
      >
        Ship
      </Button>
    );
  }
  if (statusUpper === "SHIPPED") {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onQuickAdvance(order)}
      >
        Deliver
      </Button>
    );
  }
  if (terminalAction.kind === "delivered") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--status-success-fg)]">
        <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{terminalAction.tableLabel}</span>
      </span>
    );
  }
  if (terminalAction.kind === "cancelled" || terminalAction.kind === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--status-error-fg)]">
        <XCircle className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{terminalAction.tableLabel}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--status-warning-fg)]">
      <Clock className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{terminalAction.tableLabel}</span>
    </span>
  );
}

export function OrderQueueTable({
  orders,
  onSelectOrder,
  onQuickAdvance,
}: OrderQueueTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center space-y-3">
        <div className="size-12 rounded-full bg-[var(--canvas)] border border-[var(--border)] mx-auto flex items-center justify-center text-[var(--ink-2)]">
          <ShoppingBag className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-[var(--ink)] text-sm">
            No orders found
          </h3>
          <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto leading-relaxed">
            No orders match this status filter yet. Share your store link to start
            receiving orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead className="hidden sm:table-cell">Items</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead className="hidden md:table-cell">Age</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const isCOD = order.payment_method === "COD";
          const payBadge = paymentView(order);

          const recipientName =
            order.customer_name ||
            order.shipping_address_snapshot?.recipient_name ||
            order.customer_email ||
            "Customer";
          const phone =
            order.shipping_address_snapshot?.phone || order.customer_phone || "";

          const totalItemsCount = order.items.reduce(
            (sum, it) => sum + (it.quantity || 1),
            0
          );

          const payIcon =
            payBadge.tone === "success"
              ? CreditCard
              : payBadge.tone === "error"
              ? XCircle
              : isCOD
              ? Banknote
              : Clock;

          return (
            <TableRow
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="cursor-pointer group"
            >
              <TableCell className="font-semibold text-[var(--ink)] tabular-nums whitespace-nowrap">
                {order.order_number}
              </TableCell>

              <TableCell>
                <div className="space-y-0.5">
                  <p className="font-medium text-[var(--ink)] truncate max-w-[130px] sm:max-w-[200px]">
                    {recipientName}
                  </p>
                  {phone && (
                    <p className="text-xs text-[var(--ink-2)] tabular-nums truncate max-w-[130px] sm:max-w-[200px]">
                      {phone}
                    </p>
                  )}
                </div>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <div className="space-y-0.5">
                  <p className="font-medium text-[var(--ink)] truncate max-w-[180px]">
                    {order.items[0]?.product_name_snapshot || "Items"}
                  </p>
                  <p className="text-xs text-[var(--ink-2)] tabular-nums">
                    {totalItemsCount} {totalItemsCount === 1 ? "unit" : "units"}
                    {order.items.length > 1 && ` (+${order.items.length - 1} more)`}
                  </p>
                </div>
              </TableCell>

              <TableCell className="text-right font-semibold text-[var(--ink)] tabular-nums whitespace-nowrap">
                {formatNpr(order.total_minor)}
              </TableCell>

              <TableCell className="whitespace-nowrap">
                <Chip tone={payBadge.tone} icon={payIcon}>
                  {payBadge.label}
                </Chip>
              </TableCell>

              <TableCell className="hidden md:table-cell text-xs text-[var(--ink-2)] tabular-nums whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5 text-[var(--ink-2)]" aria-hidden="true" />
                  {getRelativeTime(order.created_at)}
                </span>
              </TableCell>

              <TableCell
                className="text-right whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                {renderActionCell(order, onQuickAdvance)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
