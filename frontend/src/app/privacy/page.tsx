import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ShopCraft handles merchant and shopper data in Nepal.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-zinc-500">
            Last updated: November 2026 · ShopCraft (Capstone Beta)
          </p>
        </header>

        <div className="space-y-8 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed border-t border-zinc-200 dark:border-white/10 pt-8">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              1. What we collect
            </h2>
            <p>
              When you sign up as a merchant, we store your email address for login verification and the store details you enter (store name, slug, contact phone, and location). When a shopper places an order on a storefront, we store the delivery name, phone number, province/district/ward address, and order items so the merchant can fulfill it.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              2. Payments
            </h2>
            <p>
              We do not store bank passwords or card numbers. Digital payments go through Khalti&apos;s hosted checkout and are verified server-side via Khalti&apos;s lookup API.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              3. How data is shared
            </h2>
            <p>
              Shopper order details are visible only to the store owner fulfilling that order. We do not sell or share user data with advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              4. Contact
            </h2>
            <p>
              Questions or removal requests can be sent to{" "}
              <a href="mailto:hello@shopcraft.me" className="underline font-medium text-zinc-900 dark:text-white">
                hello@shopcraft.me
              </a>
              .
            </p>
          </section>
        </div>

        <p className="text-xs text-zinc-500 border-t border-zinc-200 dark:border-white/10 pt-6">
          See also our <Link href="/terms" className="underline text-zinc-700 dark:text-zinc-300">Terms of Service</Link>.
        </p>
      </div>
    </div>
  );
}
