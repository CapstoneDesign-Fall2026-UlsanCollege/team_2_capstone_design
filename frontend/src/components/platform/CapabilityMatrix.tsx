import React from "react";
import { Check } from "lucide-react";

const WORKS_TODAY = [
  "Your store is live at shopcraft.me/s/your-name.",
  "Pick a look and add your logo.",
  "Products with sizes and variants, in rupees.",
  "Khalti payments (test mode until you add your live key), or cash on delivery.",
  "Delivery addresses by province, district and ward.",
  "Printable packing slip showing PAID or cash to collect.",
];

const COMING_NEXT = [
  "SMS and WhatsApp order updates",
  "Courier labels",
  "Your own domain name",
];

export function CapabilityMatrix() {
  return (
    <section
      id="features"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-zinc-200 dark:border-white/5 scroll-mt-20"
    >
      <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white text-center mb-10">
        What works today
      </h2>

      <ul className="space-y-4 text-left">
        {WORKS_TODAY.map((item) => (
          <li key={item} className="flex items-start gap-3 text-base text-zinc-800 dark:text-zinc-200">
            <Check className="w-5 h-5 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500 text-left">
        <span className="font-semibold">Coming next:</span> {COMING_NEXT.join(" · ")}.
      </p>
      <p className="mt-2 text-sm text-zinc-500 text-left">Free while in beta.</p>
    </section>
  );
}
