import React from "react";

interface OrderRow {
  id: string;
  customer: string;
  itemAndWard: string;
  price: string;
  statusLabel: string;
  dotColorClass: string;
}

const SAMPLE_ORDERS: OrderRow[] = [
  {
    id: "#HR-1048",
    customer: "Aarav Shrestha",
    itemAndWard: "Gulmi Bourbon (500g) · Lalitpur Ward 3",
    price: "Rs. 1,450",
    statusLabel: "Paid · Khalti",
    dotColorClass: "bg-[#22C55E]",
  },
  {
    id: "#HR-1047",
    customer: "Sabina Gurung",
    itemAndWard: "Ilam First Flush (250g) · Pokhara Ward 6",
    price: "Rs. 890",
    statusLabel: "Collect cash · COD",
    dotColorClass: "bg-[#F59E0B]",
  },
  {
    id: "#HR-1046",
    customer: "Bikesh Maharjan",
    itemAndWard: "Nuwakot Typica (250g) · Patan Ward 11",
    price: "Rs. 780",
    statusLabel: "Paid · Khalti",
    dotColorClass: "bg-[#22C55E]",
  },
  {
    id: "#HR-1045",
    customer: "Prativa Tamang",
    itemAndWard: "Wild Cliff Honey (500g) · Kathmandu Ward 10",
    price: "Rs. 1,650",
    statusLabel: "Collect cash · COD",
    dotColorClass: "bg-[#F59E0B]",
  },
  {
    id: "#HR-1044",
    customer: "Roshan Adhikari",
    itemAndWard: "Kakani Roast + V60 Filters · Bhaktapur Ward 4",
    price: "Rs. 2,130",
    statusLabel: "Packed · Khalti",
    dotColorClass: "bg-[#3B82F6]",
  },
  {
    id: "#HR-1043",
    customer: "Nisha Karki",
    itemAndWard: "Dhaulagiri Blend (1kg) · Kathmandu Ward 16",
    price: "Rs. 2,580",
    statusLabel: "Delivered · COD",
    dotColorClass: "bg-[#94A3B8]",
  },
];

export function DashboardMockupPreview() {
  return (
    <section
      id="orders"
      className="py-14 px-5 bg-[#F2F2EE] dark:bg-[#1A1D23] border-b border-[#E2E2DC] dark:border-white/10 scroll-mt-20"
    >
      <div className="max-w-[1040px] mx-auto">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
          <h2
            className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.01em] leading-[1.18] text-left text-[#161614] dark:text-[#ECECE9]"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            Recent store orders
          </h2>
          <span className="text-[13px] sc-mono text-[#4A4A45] dark:text-[#B4B6BD]">
            shopcraft.me/merchant/himalayan-roasters/orders
          </span>
        </div>

        <div className="rounded-xl border border-[#E2E2DC] dark:border-white/10 bg-white dark:bg-[#15171B] overflow-hidden">
          {/* Summary bar */}
          <div className="px-4 py-3 border-b border-[#E2E2DC] dark:border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-[13px]">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#4A4A45] dark:text-[#B4B6BD]">
              <span>
                <strong className="text-[#161614] dark:text-[#ECECE9]">6</strong> orders today
              </span>
              <span>
                Paid online:{" "}
                <strong className="sc-mono text-[#161614] dark:text-[#ECECE9]">Rs. 4,360</strong>
              </span>
              <span>
                Cash to collect:{" "}
                <strong className="sc-mono text-[#161614] dark:text-[#ECECE9]">Rs. 5,120</strong>
              </span>
            </div>
            <span className="text-[12px] text-[#686862] dark:text-[#8C9099]">
              Himalayan Coffee Roasters
            </span>
          </div>

          {/* 6 Realistic Order Rows */}
          <div>
            {SAMPLE_ORDERS.map((order) => (
              <div
                key={order.id}
                className="px-4 py-3.5 border-b last:border-b-0 border-[#E2E2DC] dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-2 text-left"
              >
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[14px]">
                  <span className="text-[13px] sc-mono font-semibold text-[#686862] dark:text-[#8C9099]">
                    {order.id}
                  </span>
                  <span className="font-semibold text-[#161614] dark:text-[#ECECE9]">
                    {order.customer}
                  </span>
                  <span className="text-[#4A4A45] dark:text-[#B4B6BD]">
                    {order.itemAndWard}
                  </span>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3.5 shrink-0">
                  <span className="text-[14px] sc-mono font-semibold text-[#161614] dark:text-[#ECECE9]">
                    {order.price}
                  </span>
                  <span className="inline-flex items-center gap-[7px] px-2.5 py-1 rounded-[6px] border border-[#E2E2DC] dark:border-white/10 bg-[#F9F9F7] dark:bg-[#0E0F12] text-[12px] font-semibold text-[#161614] dark:text-[#ECECE9] whitespace-nowrap">
                    <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${order.dotColorClass}`} />
                    <span>{order.statusLabel}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
