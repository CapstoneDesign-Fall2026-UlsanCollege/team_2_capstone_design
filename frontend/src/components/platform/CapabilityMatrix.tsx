import React from "react";

const WORKS_TODAY: React.ReactNode[] = [
  <span key="1">
    Store address at <span className="sc-mono">shopcraft.me/s/your-name</span>
  </span>,
  <span key="2">Your logo, your colors, your fonts</span>,
  <span key="3">Product sizes and variants in NPR</span>,
  <span key="4">Khalti or cash on delivery at checkout</span>,
  <span key="5">Nepal addresses by province and ward</span>,
  <span key="6">Printable packing slips showing paid or cash due</span>,
];

export function CapabilityMatrix() {
  return (
    <section
      id="features"
      className="py-11 px-5 border-b border-[#E2E2DC] dark:border-white/10 scroll-mt-20"
    >
      <div className="max-w-[1040px] mx-auto">
        <h2
          className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.01em] leading-[1.18] text-left text-[#161614] dark:text-[#ECECE9] mb-6"
          style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
        >
          What works today
        </h2>

        <ul className="grid grid-cols-1 md:grid-cols-2 border-t border-[#E2E2DC] dark:border-white/10 text-left">
          {WORKS_TODAY.map((item, idx) => (
            <li
              key={idx}
              className="flex items-baseline gap-3 py-3.5 pr-4 border-b border-[#E2E2DC] dark:border-white/10 text-[15px] text-[#161614] dark:text-[#ECECE9]"
            >
              <span className="text-[12px] font-semibold text-[#686862] dark:text-[#8C9099] shrink-0">
                0{idx + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-4.5 text-[14px] text-[#4A4A45] dark:text-[#B4B6BD] text-left">
          <strong className="text-[#161614] dark:text-[#ECECE9]">Coming next:</strong>{" "}
          SMS order updates, courier labels, custom domain names.
          <span className="inline-block ml-2 px-2 py-0.5 rounded-[6px] border border-[#E2E2DC] dark:border-white/15 bg-white dark:bg-[#15171B] text-[#161614] dark:text-[#ECECE9] text-[12px] font-semibold">
            Free while in beta
          </span>
        </p>
      </div>
    </section>
  );
}
