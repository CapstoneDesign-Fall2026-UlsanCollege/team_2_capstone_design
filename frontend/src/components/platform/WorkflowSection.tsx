import React from "react";

const STEPS = [
  {
    num: "१",
    label: "STEP 1",
    title: "Name your store",
    desc: "Type a name. Your link is ready at shopcraft.me/s/your-name.",
  },
  {
    num: "२",
    label: "STEP 2",
    title: "Pick a look",
    desc: "Choose one of four looks and add your logo.",
  },
  {
    num: "३",
    label: "STEP 3",
    title: "Add your products",
    desc: "Add photos, prices in rupees, sizes and variants. Then share your link.",
  },
];

export function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-32 bg-paper scroll-mt-16"
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-7">
        <div className="max-w-[820px] mx-auto text-center">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-3 font-medium">
            How it works
          </p>
          <h2 className="mt-4 font-display font-semibold tracking-[-0.048em] leading-none text-ink text-[36px] sm:text-[60px] lg:text-[76px]">
            Three steps to <span className="text-accent">open.</span>
          </h2>
        </div>

        <ol className="mt-14 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12">
          {STEPS.map((s) => (
            <li key={s.label} className="border-t border-line-strong pt-6">
              <span
                aria-hidden="true"
                className="block font-devanagari text-[84px] sm:text-[120px] leading-[0.9] text-accent"
              >
                {s.num}
              </span>
              <p className="font-mono text-[11.5px] tracking-[0.1em] text-ink-3 mt-4">
                {s.label}
              </p>
              <h3 className="mt-1.5 font-display font-semibold tracking-[-0.04em] text-[28px] sm:text-[34px] leading-tight text-ink">
                {s.title}
              </h3>
              <p className="mt-2.5 text-[15.5px] text-ink-2 leading-relaxed max-w-[320px]">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
