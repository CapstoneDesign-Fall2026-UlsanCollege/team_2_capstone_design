"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  RotateCcw,
  Search,
} from "lucide-react";
import {
  fetchMerchantOrders,
  OrderDetail,
  OrderQueueCounts,
  transitionMerchantOrderStatus,
} from "@/lib/api";
import { classifyMerchantPageError } from "@/lib/merchant-guard";
import { OrderQueueTable } from "@/components/merchant/OrderQueueTable";
import { OrderDetailSheet } from "@/components/merchant/OrderDetailSheet";
import {
  createLatestTabRefresher,
  OrdersQueueTab,
  resolveOrdersStatusTab,
} from "@/lib/merchant-status";

interface PendingUndo {
  orderId: number;
  orderNumber: string;
  previousStatus: string;
  nextStatus: string;
  previousPaymentStatus: string;
  expiresAt: number;
}

function MerchantOrdersContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeSlug = typeof params.storeSlug === "string" ? params.storeSlug : "";
  const statusQueryParam = searchParams.get("status");

  const [activeTab, setActiveTab] = useState<OrdersQueueTab>(() =>
    resolveOrdersStatusTab(statusQueryParam)
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [counts, setCounts] = useState<OrderQueueCounts>({
    all: 0,
    new: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // 5-second non-blocking undo state
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadSeqRef = useRef<number>(0);

  const handleOrdersError = useCallback(
    (err: unknown) => {
      const action = classifyMerchantPageError(
        err,
        storeSlug,
        `/merchant/${encodeURIComponent(storeSlug)}/orders`
      );
      if (action.kind === "unauthenticated") {
        setTimeout(() => router.replace(action.redirectTo), 0);
        return;
      }
      if (action.kind === "not_found") {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("shopcraft_merchant_notice", action.notice);
        }
        setTimeout(() => router.replace(action.redirectTo), 0);
        return;
      }
      setError(action.message);
    },
    [storeSlug, router]
  );

  const loadOrders = useCallback(
    (statusFilter: OrdersQueueTab = activeTab, search: string = searchQuery) => {
      if (!storeSlug) return;
      const reqId = ++loadSeqRef.current;
      setIsLoading(true);
      setError(null);
      fetchMerchantOrders(storeSlug, {
        status: statusFilter,
        search: search.trim() || undefined,
      })
        .then((res) => {
          if (reqId === loadSeqRef.current) {
            setOrders(res.orders);
            setCounts(res.counts);
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (reqId === loadSeqRef.current) {
            handleOrdersError(err);
          }
        })
        .finally(() => {
          if (reqId === loadSeqRef.current) {
            setIsLoading(false);
          }
        });
    },
    [storeSlug, activeTab, searchQuery, handleOrdersError]
  );

  const loadOrdersRef = useRef(loadOrders);
  const refresherRef = useRef<ReturnType<typeof createLatestTabRefresher<OrdersQueueTab>> | null>(
    null
  );

  useEffect(() => {
    loadOrdersRef.current = loadOrders;
  }, [loadOrders]);

  useEffect(() => {
    if (!refresherRef.current) {
      refresherRef.current = createLatestTabRefresher(
        activeTab,
        searchQuery,
        (tab, search) => loadOrdersRef.current(tab, search)
      );
    } else {
      refresherRef.current.setLatest(activeTab, searchQuery);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!storeSlug) return;
    let ignore = false;
    const reqId = ++loadSeqRef.current;
    fetchMerchantOrders(storeSlug, {
      status: activeTab,
      search: searchQuery.trim() || undefined,
    })
      .then((res) => {
        if (!ignore && reqId === loadSeqRef.current) {
          setOrders(res.orders);
          setCounts(res.counts);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore && reqId === loadSeqRef.current) {
          handleOrdersError(err);
        }
      })
      .finally(() => {
        if (!ignore && reqId === loadSeqRef.current) {
          setIsLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [storeSlug, activeTab, searchQuery, handleOrdersError]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders(activeTab, searchQuery);
  };

  const handleSelectOrder = (order: OrderDetail) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleAdvanceStatus = async (
    order: OrderDetail,
    toStatus: string,
    note?: string
  ) => {
    const prevStatus = order.status;
    const prevPaymentStatus = order.payment_status;

    // Optimistically update list
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: toStatus } : o))
    );

    // Clear existing timer if any
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    try {
      const updated = await transitionMerchantOrderStatus(storeSlug, order.id, {
        to_status: toStatus,
        note,
      });

      setSelectedOrder(updated);

      // Start 5-second non-blocking undo window
      const undoPayload: PendingUndo = {
        orderId: order.id,
        orderNumber: order.order_number,
        previousStatus: prevStatus,
        nextStatus: toStatus,
        previousPaymentStatus: prevPaymentStatus,
        expiresAt: Date.now() + 5000,
      };

      setPendingUndo(undoPayload);

      undoTimeoutRef.current = setTimeout(() => {
        setPendingUndo(null);
        if (refresherRef.current) {
          refresherRef.current.refreshLatest();
        } else {
          loadOrdersRef.current(activeTab, searchQuery);
        }
      }, 5000);
    } catch (err: unknown) {
      handleOrdersError(err);
      // Revert optimistic update
      if (refresherRef.current) {
        refresherRef.current.refreshLatest();
      } else {
        loadOrders(activeTab, searchQuery);
      }
    }
  };

  const handleQuickAdvance = (order: OrderDetail) => {
    const s = order.status.toUpperCase();
    let nextStatus = "PROCESSING";
    if (s === "PROCESSING" || s === "PACKED") {
      nextStatus = "SHIPPED";
    } else if (s === "SHIPPED") {
      nextStatus = "DELIVERED";
    }
    handleAdvanceStatus(order, nextStatus);
  };

  const handleExecuteUndo = async () => {
    if (!pendingUndo) return;
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    const { orderId, previousStatus } = pendingUndo;
    setPendingUndo(null);

    try {
      await transitionMerchantOrderStatus(storeSlug, orderId, {
        to_status: previousStatus,
        note: "Action undone by merchant",
      });
      if (refresherRef.current) {
        refresherRef.current.refreshLatest();
      } else {
        loadOrders(activeTab, searchQuery);
      }
    } catch (err: unknown) {
      handleOrdersError(err);
      if (refresherRef.current) {
        refresherRef.current.refreshLatest();
      } else {
        loadOrders(activeTab, searchQuery);
      }
    }
  };

  const tabs: Array<{ id: OrdersQueueTab; label: string; count: number }> = [
    { id: "new", label: "New", count: counts.new },
    { id: "packed", label: "Packed", count: counts.packed },
    { id: "shipped", label: "Shipped", count: counts.shipped },
    { id: "delivered", label: "Delivered", count: counts.delivered },
    { id: "all", label: "All", count: counts.all },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Orders Fulfillment
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] font-mono">
            Manage customer orders, packing workflows, and delivery confirmation
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="search"
            inputMode="search"
            placeholder="Search order #, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </form>
      </div>

      {/* Linear Status Tabs (DESIGN.md §4c) */}
      <div className="border-b border-[var(--border)] flex items-center gap-1 sm:gap-2 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); setIsLoading(true); }}
              className={`px-3 py-2 text-xs font-mono font-medium rounded-t-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer border-b-2 -mb-px ${
                isActive
                  ? "border-[var(--primary)] text-[var(--foreground)] font-bold bg-[var(--muted)]/40"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums ${
                  isActive
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-700 dark:text-red-300 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadOrders(activeTab, searchQuery)}
            className="px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] font-medium cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-[var(--muted-foreground)]">
          Loading order queue...
        </div>
      ) : (
        <OrderQueueTable
          orders={orders}
          onSelectOrder={handleSelectOrder}
          onQuickAdvance={handleQuickAdvance}
        />
      )}

      {/* Slide-Over Order Detail Drawer */}
      <OrderDetailSheet
        order={selectedOrder}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onAdvanceStatus={handleAdvanceStatus}
        storeSlug={storeSlug}
      />

      {/* 5-Second Non-Blocking Undo Bar (DESIGN.md §4c) */}
      {pendingUndo && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-xl flex items-center gap-3 text-xs font-mono">
            <span>
              Order <span className="font-bold">{pendingUndo.orderNumber}</span> marked as{" "}
              <span className="font-bold uppercase">{pendingUndo.nextStatus}</span>
            </span>

            <button
              type="button"
              onClick={handleExecuteUndo}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo (5s)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MerchantOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-mono text-[var(--muted-foreground)]">
          Loading order queue...
        </div>
      }
    >
      <MerchantOrdersContent />
    </Suspense>
  );
}
