"use client";

import React, { use, useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  ArrowUpDown,
  ShoppingBag,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  ApiError,
  formatNpr,
  fetchMerchantCustomers,
  MerchantCustomerItem,
} from "@/lib/api";
import { CustomerDetailSheet } from "@/components/merchant/CustomerDetailSheet";

interface PageProps {
  params: Promise<{ storeSlug: string }>;
}

export default function MerchantCustomersPage({ params }: PageProps) {
  const { storeSlug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<MerchantCustomerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<MerchantCustomerItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const loadCustomers = useCallback(
    (query?: string) => {
      let active = true;
      fetchMerchantCustomers(storeSlug, query)
        .then((data) => {
          if (active) {
            setCustomers(data);
            setError(null);
            setLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!active) return;
          const msg = err instanceof Error ? err.message : "Failed to load customers";
          const isAuth =
            (err instanceof ApiError && (err.status === 401 || err.status === 403)) ||
            msg.includes("401") ||
            msg.includes("403") ||
            msg.toLowerCase().includes("unauthorized") ||
            msg.toLowerCase().includes("credentials");

          if (isAuth) {
            setTimeout(
              () => router.replace(`/login?next=/merchant/${encodeURIComponent(storeSlug)}/customers`),
              0
            );
            return;
          }
          setError(msg);
          setLoading(false);
        });

      return () => {
        active = false;
      };
    },
    [storeSlug, router]
  );

  useEffect(() => {
    const cleanup = loadCustomers();
    return cleanup;
  }, [loadCustomers]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      loadCustomers(searchQuery.trim() || undefined);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery, loadCustomers]);

  // Metrics aggregations
  const totalCustomers = customers.length;
  const repeatCustomers = useMemo(
    () => customers.filter((c) => c.orders_count > 1).length,
    [customers]
  );
  const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
  const totalSpentMinor = useMemo(
    () => customers.reduce((acc, c) => acc + (c.total_spent_minor || 0), 0),
    [customers]
  );
  const avgSpentMinor = totalCustomers > 0 ? Math.round(totalSpentMinor / totalCustomers) : 0;

  const handleSelectCustomer = (cust: MerchantCustomerItem) => {
    setSelectedCustomer(cust);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            <span>Customers</span>
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Directory of shoppers who have placed orders or subscribed with your store.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)] text-xs transition-colors"
          >
            <span>Live Store</span>
            <span className="text-[10px]">↗</span>
          </Link>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted-foreground)]">
            <span>Total Customers</span>
            <Users className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <p className="text-xl font-bold font-mono text-[var(--foreground)]">
            {totalCustomers}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)] font-mono">
            Direct store shoppers
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted-foreground)]">
            <span>Repeat Shoppers</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-[var(--foreground)]">
            {repeatCustomers}{" "}
            <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
              ({repeatRate}%)
            </span>
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)] font-mono">
            Placed 2+ orders
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted-foreground)]">
            <span>Customer GMV</span>
            <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-bold font-mono text-[var(--foreground)] tabular-nums">
            {formatNpr(totalSpentMinor)}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)] font-mono">
            Paid &amp; confirmed total
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted-foreground)]">
            <span>Average Spend</span>
            <span className="text-[10px] font-mono text-zinc-400">NPR</span>
          </div>
          <p className="text-xl font-bold font-mono text-[var(--foreground)] tabular-nums">
            {formatNpr(avgSpentMinor)}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)] font-mono">
            Per customer average
          </p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)]"
          />
        </div>

        <div className="text-xs font-mono text-[var(--muted-foreground)] text-right">
          Showing {customers.length} {customers.length === 1 ? "customer" : "customers"}
        </div>
      </div>

      {/* Main Table / Resource List */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-12 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
          <div className="h-14 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
          <div className="h-14 rounded-lg border border-[var(--border)] bg-[var(--card)] animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center space-y-3">
          <p className="text-xs font-semibold text-[var(--destructive)]">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadCustomers();
            }}
            className="px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--secondary)] text-xs font-medium cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--secondary)] flex items-center justify-center text-[var(--muted-foreground)]">
            <Users className="w-6 h-6" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              {searchQuery ? "No matching customers found" : "No customers yet"}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {searchQuery
                ? `No customers match query "${searchQuery}". Try searching by phone number or name.`
                : "Customers will appear here automatically as soon as shoppers complete an order or subscribe."}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-[11px] font-mono text-[var(--muted-foreground)] uppercase">
                  <th className="py-2.5 px-4 font-semibold">Customer</th>
                  <th className="py-2.5 px-4 font-semibold">Contact</th>
                  <th className="py-2.5 px-4 font-semibold">City</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Orders</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total Spent</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Joined</th>
                  <th className="py-2.5 px-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {customers.map((c) => {
                  const initials = (c.full_name || c.email || "C")
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="hover:bg-[var(--secondary)]/40 transition-colors cursor-pointer group"
                    >
                      {/* Customer Name & Initials */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--foreground)] group-hover:text-emerald-500 transition-colors truncate">
                              {c.full_name || "Guest Customer"}
                            </p>
                            <p className="text-[11px] font-mono text-[var(--muted-foreground)] truncate">
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-mono text-[var(--muted-foreground)]">
                        {c.phone ? (
                          <span className="text-[var(--foreground)] font-medium">
                            +977 {c.phone}
                          </span>
                        ) : (
                          <span className="italic text-zinc-400">Not provided</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-[var(--foreground)]">
                        {c.city || "Kathmandu"}
                      </td>

                      {/* Orders Count */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]">
                          {c.orders_count}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--foreground)] tabular-nums">
                        {formatNpr(c.total_spent_minor)}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-[var(--muted-foreground)]">
                        {new Date(c.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Arrow indicator */}
                      <td className="py-3 px-2 text-right">
                        <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Detail Sheet */}
      <CustomerDetailSheet
        storeSlug={storeSlug}
        customer={selectedCustomer}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
}
