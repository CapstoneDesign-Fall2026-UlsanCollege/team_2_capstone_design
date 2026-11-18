"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExternalLink, Printer } from "lucide-react";

interface SampleOrder {
  id: string;
  customer: string;
  item: string;
  address: string;
  phone: string;
  amount: string;
  payment: "KHALTI PAID" | "COD TO COLLECT";
}

const SAMPLE_ORDERS: SampleOrder[] = [
  {
    id: "#ORD-9821",
    customer: "Bikesh Shrestha",
    item: "Gulmi Bourbon Roast (500g · Whole Bean)",
    address: "Lalitpur Ward 3, Jhamsikhel",
    phone: "9841001122",
    amount: "Rs. 1,450",
    payment: "KHALTI PAID",
  },
  {
    id: "#ORD-9820",
    customer: "Sita Sharma",
    item: "Ilam First Flush Tea (250g)",
    address: "Kathmandu Ward 10, Baneshwor",
    phone: "9851002233",
    amount: "Rs. 1,850",
    payment: "COD TO COLLECT",
  },
  {
    id: "#ORD-9819",
    customer: "Rohit Kumar",
    item: "Nuwakot Heritage Roast (250g · Pour-Over)",
    address: "Bhaktapur Ward 4, Suryabinayak",
    phone: "9801003344",
    amount: "Rs. 2,200",
    payment: "COD TO COLLECT",
  },
];

export function DashboardMockupPreview() {
  const [selectedOrderId, setSelectedOrderId] = useState(SAMPLE_ORDERS[0].id);
  const [view, setView] = useState<"orders" | "slip">("orders");

  const activeOrder =
    SAMPLE_ORDERS.find((o) => o.id === selectedOrderId) || SAMPLE_ORDERS[0];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121214] overflow-hidden text-left text-zinc-900 dark:text-zinc-100">
        {/* Clean Header Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#18181b] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              shopcraft.me/merchant/himalayan-roasters
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("orders")}
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold cursor-pointer transition-colors ${
                view === "orders"
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Orders (3)
            </button>
            <button
              type="button"
              onClick={() => setView("slip")}
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors ${
                view === "slip"
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Printer className="w-3 h-3" />
              <span>Packing slip</span>
            </button>
            <Link
              href="/s/himalayan-roasters"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white ml-2"
            >
              <span>Live store</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {view === "orders" ? (
          <div className="divide-y divide-zinc-200 dark:divide-white/5 text-xs font-mono">
            {SAMPLE_ORDERS.map((order) => {
              const isPaid = order.payment === "KHALTI PAID";
              return (
                <div
                  key={order.id}
                  className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {order.id}
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {order.customer}
                      </span>
                      <span className="text-zinc-500">· {order.item}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {order.address}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {order.amount}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isPaid
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {isPaid ? "Khalti Paid" : "COD"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setView("slip");
                      }}
                      className="text-[11px] text-zinc-600 dark:text-zinc-400 underline hover:text-zinc-950 dark:hover:text-white cursor-pointer"
                    >
                      View slip
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 sm:p-6 bg-zinc-50 dark:bg-[#0f0f11]">
            <div className="max-w-md mx-auto p-5 rounded-xl bg-white text-zinc-900 border border-zinc-300 font-mono text-xs space-y-4">
              <div className="flex items-start justify-between border-b border-zinc-900 pb-3">
                <div>
                  <p className="font-bold uppercase tracking-wide text-sm">
                    Himalayan Coffee Roasters
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    shopcraft.me/s/himalayan-roasters
                  </p>
                </div>
                <span className="font-bold">{activeOrder.id}</span>
              </div>

              <div
                className={`p-2.5 rounded text-center font-bold text-xs border ${
                  activeOrder.payment === "KHALTI PAID"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-rose-50 text-rose-800 border-rose-300"
                }`}
              >
                {activeOrder.payment === "KHALTI PAID"
                  ? `KHALTI PAID (${activeOrder.amount})`
                  : `COD CASH TO COLLECT: ${activeOrder.amount}`}
              </div>

              <div className="space-y-1 text-[11px]">
                <p>
                  <span className="text-zinc-500">Customer:</span>{" "}
                  <span className="font-bold">{activeOrder.customer}</span>
                </p>
                <p>
                  <span className="text-zinc-500">Phone:</span> {activeOrder.phone}
                </p>
                <p>
                  <span className="text-zinc-500">Deliver to:</span>{" "}
                  {activeOrder.address}
                </p>
                <p className="pt-2 border-t border-zinc-200">
                  <span className="text-zinc-500">Item:</span> {activeOrder.item}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Strip */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#18181b] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
          <span>
            Store link:{" "}
            <code className="text-zinc-800 dark:text-zinc-300 font-semibold">
              shopcraft.me/s/himalayan-roasters
            </code>
          </span>
          <span>Sample orders · Paid in NPR</span>
        </div>
      </div>
    </div>
  );
}
