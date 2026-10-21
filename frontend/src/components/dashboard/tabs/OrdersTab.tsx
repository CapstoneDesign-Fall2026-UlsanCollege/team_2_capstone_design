"use client";

import { Printer } from "lucide-react";

interface OrdersTabProps {
  orders: any[];
  onSelectReceipt: (order: any) => void;
}

export default function OrdersTab({ orders, onSelectReceipt }: OrdersTabProps) {
  return (
    <section className="bg-white border border-[#E6DEC8] rounded-2xl p-6 md:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E6DEC8] gap-2 mb-6">
        <div>
          <h3 className="text-2xl font-serif font-bold text-[#1A1512]">
            Order History & Tax Invoices
          </h3>
          <p className="font-mono text-xs text-[#5C5042] mt-0.5">
            Official records, courier tracking details, and printable VAT invoices.
          </p>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest font-bold text-[#5C5042] bg-[#FAF8F5] px-3 py-1.5 border border-[#E6DEC8] rounded-lg self-start sm:self-auto">
          {orders.length} Invoices Available
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="text-center py-12 font-mono text-xs text-[#5C5042]">
          No past deliveries on record yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-[#FAF8F5] text-xs uppercase tracking-wider text-[#5C5042] font-bold border-b border-[#E6DEC8]">
              <tr>
                <th className="px-4 py-3.5">Invoice ID</th>
                <th className="px-4 py-3.5">Roast Selection</th>
                <th className="px-4 py-3.5">Commitment</th>
                <th className="px-4 py-3.5">Total Paid</th>
                <th className="px-4 py-3.5">Tracking Status</th>
                <th className="px-4 py-3.5 text-right">Official Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DEC8]">
              {orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="px-4 py-4 font-bold text-[#1A1512] whitespace-nowrap">
                    INV-{order.id.toString().padStart(5, "0")}
                    <p className="text-xs text-[#5C5042] font-normal">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-sans">
                    <p className="font-serif font-bold text-sm text-[#1A1512]">{order.origin_name}</p>
                    <p className="font-mono text-xs text-[#5C5042]">{order.weight_kg} kg • Specialty Roast</p>
                  </td>
                  <td className="px-4 py-4 text-[#5C5042]">{order.plan_name}</td>
                  <td className="px-4 py-4 font-bold text-[#1A1512] whitespace-nowrap">
                    Rs. {order.total_price_npr}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs uppercase font-bold tracking-wider bg-[#E7F3E8] text-[#2E6B34] rounded-md border border-[#C3E4C6]">
                      {order.status || "CONFIRMED"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectReceipt(order)}
                      className="min-h-[40px] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#A3432A] hover:bg-[#FAF5F2] border border-[#E6DEC8] hover:border-[#A3432A] rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Printer size={13} /> View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
