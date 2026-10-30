import Link from "next/link";

export default async function MerchantOverviewPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            Store Overview
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Workspace for <span className="font-mono text-[var(--foreground)]">{storeSlug}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--st-new)" }}
            aria-hidden="true"
          />
          <span className="font-medium text-[var(--foreground)]">Ready</span>
          <span className="text-[var(--muted-foreground)]">· Tenant active</span>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--card-foreground)] mb-2">
          Merchant Console Shell
        </h2>
        <p className="text-xs text-[var(--muted-foreground)] mb-4 leading-relaxed">
          The merchant console operates under isolated neutral zinc tokens. Live store preview and
          order queue controls will be populated here in Phase 2.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Link
            href={`/s/${encodeURIComponent(storeSlug)}`}
            className="inline-flex items-center justify-center rounded px-3 py-1.5 font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Visit Storefront
          </Link>
          <Link
            href="/account/addresses"
            className="inline-flex items-center justify-center rounded px-3 py-1.5 font-medium bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-colors border border-[var(--border)]"
          >
            Manage Addresses
          </Link>
        </div>
      </div>
    </div>
  );
}
