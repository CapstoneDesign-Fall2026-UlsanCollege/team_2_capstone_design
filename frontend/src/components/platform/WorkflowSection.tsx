import React from "react";

const STEPS = [
  { num: "1", title: "Name your store", desc: "Type a name. Your store address is made for you." },
  { num: "2", title: "Pick a look", desc: "Choose one of four looks and add your logo." },
  { num: "3", title: "Add products, get paid", desc: "Customers pay via Khalti or pay cash at delivery." },
];

export function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-zinc-200 dark:border-white/5 scroll-mt-20"
    >
      <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white text-center mb-12">
        How it works
      </h2>
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
        {STEPS.map((s) => (
          <li key={s.num}>
            <span className="text-3xl font-black font-mono text-zinc-300 dark:text-zinc-700">
              {s.num}
            </span>
            <h3 className="mt-2 text-lg font-bold text-zinc-900 dark:text-white">{s.title}</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {s.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
