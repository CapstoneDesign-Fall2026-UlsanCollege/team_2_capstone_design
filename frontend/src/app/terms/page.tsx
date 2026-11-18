import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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

        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-zinc-500">
            Last updated: November 2026 · ShopCraft (Capstone Beta)
          </p>
        </header>

        <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed border-t border-zinc-200 dark:border-white/10 pt-8">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              1. Beta service
            </h2>
            <p>
              ShopCraft is a student capstone project currently in beta and free to use. Features may change or be reset during development, so please do not rely on it as your sole accounting record yet.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              2. Store owners and orders
            </h2>
            <p>
              Each merchant is responsible for the products they list, their prices in NPR, and delivering orders placed through their storefront.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              3. Payments and delivery
            </h2>
            <p>
              Storefronts support Khalti and cash on delivery. Order cancellations, refunds, and courier hand-off are handled directly by the store you purchased from.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              4. Contact
            </h2>
            <p>
              If you have questions about these terms, email{" "}
              <a href="mailto:hello@shopcraft.me" className="underline font-medium text-zinc-900 dark:text-white">
                hello@shopcraft.me
              </a>
              .
            </p>
          </section>
        </div>

        <p className="text-xs text-zinc-500 border-t border-zinc-200 dark:border-white/10 pt-6">
          See also our <Link href="/privacy" className="underline text-zinc-700 dark:text-zinc-300">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
