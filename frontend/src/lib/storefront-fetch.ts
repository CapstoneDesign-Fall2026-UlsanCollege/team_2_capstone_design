import type { StorePublicMetadata } from "@/lib/api";
import { getServerApiOrigin } from "@/lib/env";

export type StoreFetchOutcome =
  | { status: "ok"; store: StorePublicMetadata }
  | { status: "not_found" }
  | { status: "unavailable" };

export async function fetchPublicStoreOutcome(
  storeSlug: string,
  bypassCache = false
): Promise<StoreFetchOutcome> {
  let origin: string;
  try {
    origin = getServerApiOrigin();
  } catch {
    return { status: "unavailable" };
  }

  const encodedSlug = encodeURIComponent(storeSlug);
  const fetchInit: RequestInit = bypassCache
    ? { cache: "no-store" }
    : { next: { revalidate: 60 } };

  try {
    const res = await fetch(`${origin}/api/stores/${encodedSlug}/`, fetchInit);
    if (res.status === 404) {
      return { status: "not_found" };
    }
    if (!res.ok) {
      return { status: "unavailable" };
    }
    const store = (await res.json()) as StorePublicMetadata;
    return { status: "ok", store };
  } catch {
    return { status: "unavailable" };
  }
}
