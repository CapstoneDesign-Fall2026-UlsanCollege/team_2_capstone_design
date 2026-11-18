import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About ShopCraft",
  description:
    "Why we built ShopCraft for Nepali sellers: NPR pricing, Khalti and cash on delivery, and ward-level delivery addresses.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0d0d0e] text-zinc-900 dark:text-zinc-100 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to ShopCraft</span>
        </Link>

        <header className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
            About ShopCraft
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            ShopCraft is a capstone project built for Nepali sellers who want a simple online store without international cards or complex setup.
          </p>
        </header>

        <div className="space-y-6 text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed border-t border-zinc-200 dark:border-white/10 pt-8">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Why we built it
            </h2>
            <p>
              Most store builders assume USD pricing, international credit cards, and zip codes. In Nepal, small roasters, tea gardens, and makers sell in rupees, take Khalti or cash on delivery, and deliver by province, district, and ward.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              What works right now
            </h2>
            <p>
              You can create a store at <code className="font-mono text-xs bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded">shopcraft.me/s/your-name</code>, pick one of four themes, add products with variants in NPR, accept Khalti or cash on delivery, and print a packing slip for each order.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Beta status
            </h2>
            <p>
              ShopCraft is free while in beta. Features like SMS and WhatsApp order updates, courier label integration, and custom domain mapping are not built yet.
            </p>
          </section>
        </div>

        <div className="pt-4">
          <Link
            href="/signup?next=/merchant/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <span>Create my store</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
