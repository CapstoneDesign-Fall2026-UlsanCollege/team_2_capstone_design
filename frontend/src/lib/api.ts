import { resolveApiUrl } from "@/lib/env";

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  date_joined: string;
}

export interface DeliveryAddressItem {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  ward: number;
  street_landmark: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddressPayload {
  label?: string;
  recipient_name: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  ward: number;
  street_landmark: string;
  is_default?: boolean;
}

export interface StorePublicMetadata {
  slug: string;
  name: string;
  tagline: string;
  category?: string;
  city?: string;
  province?: string;
  currency: string;
  theme_preset: "editorial-warm" | "pahadi-sage" | "ktm-bold" | "midnight-obsidian" | string;
  logo_url: string;
  banner_url?: string;
  accent_color: string;
  contact_phone: string;
  contact_email?: string;
  support_email?: string;
  address?: string;
  story_headline?: string;
  about_text?: string;
  instagram_url?: string;
  facebook_url?: string;
  inside_valley_shipping_minor: number;
  outside_valley_shipping_minor: number;
  free_shipping_threshold_minor: number | null;
  shipping_configured?: boolean;
  has_khalti?: boolean;
  cod_enabled?: boolean;
  custom_domain?: string;
}

export class ApiError extends Error {
  status: number;
  detail: string;
  fieldErrors?: Record<string, string[]>;
  data?: Record<string, unknown> | null;

  constructor(
    status: number,
    detail: string,
    fieldErrors?: Record<string, string[]>,
    data?: Record<string, unknown> | null
  ) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
    this.data = data ?? null;
  }
}

export function formatNpr(amountMinor: number | null | undefined): string {
  const safeMinor = typeof amountMinor === "number" && Number.isFinite(amountMinor) ? amountMinor : 0;
  const rupees = Math.round(safeMinor / 100);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(rupees);
  return `Rs. ${formatted}`;
}

/** Ensures order numbers display a single '#' prefix without producing '##...'. */
export function formatOrderNumber(orderNumber: string | number | null | undefined): string {
  if (orderNumber === null || orderNumber === undefined) {
    return "—";
  }
  const raw = String(orderNumber).trim();
  if (!raw) {
    return "—";
  }
  return raw.startsWith("#") ? raw : `#${raw}`;
}

export function sanitizeRedirectTarget(
  nextParam?: string | null,
  storeNameParam?: string | null
): string {
  const isSafeRelative = (target: string): boolean =>
    (/^\/[^\/\\]/.test(target) || target === "/") &&
    !target.includes("\\") &&
    !/[\r\n\t]/.test(target) &&
    !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target);

  const trimmedName = storeNameParam?.trim() || "";
  const cleanNext = nextParam?.trim() || "";
  const safeNext = cleanNext && isSafeRelative(cleanNext) ? cleanNext : "";

  if (trimmedName) {
    if (safeNext.startsWith("/merchant/new")) {
      const [pathPart, queryPart = ""] = safeNext.split("?");
      const params = new URLSearchParams(queryPart);
      params.set("name", trimmedName);
      return `${pathPart}?${params.toString()}`;
    }
    return `/merchant/new?name=${encodeURIComponent(trimmedName)}`;
  }

  return safeNext || "/merchant";
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

export async function ensureCsrfToken(): Promise<string> {
  const token = getCookie("csrftoken");
  if (token) return token;

  try {
    const res = await fetch(resolveApiUrl("/api/auth/csrf/"), {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      return data.csrfToken || getCookie("csrftoken") || "";
    }
  } catch {
    // Ignore fetch failure in SSR or offline
  }
  return getCookie("csrftoken") || "";
}

// Request deduplication & micro-cache for identical concurrent GET requests
const inFlightRequests = new Map<string, Promise<unknown>>();
const recentGetCache = new Map<string, { data: unknown; expires: number }>();
let cacheGeneration = 0;

export function invalidateApiGetCache(prefix?: string): void {
  cacheGeneration += 1;
  if (!prefix) {
    recentGetCache.clear();
    inFlightRequests.clear();
    return;
  }
  for (const key of recentGetCache.keys()) {
    if (key.startsWith(prefix)) {
      recentGetCache.delete(key);
    }
  }
  for (const key of inFlightRequests.keys()) {
    if (key.startsWith(prefix)) {
      inFlightRequests.delete(key);
    }
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  opts?: { onHeaders?: (headers: Headers) => void }
): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const bypassCache = init?.cache === "no-store" || init?.cache === "reload";
  const isCacheableGet = method === "GET" && !init?.body && !init?.signal && !bypassCache;

  if (isMutating) {
    invalidateApiGetCache();
  }

  // Deduplicate in-flight GET requests (e.g. overview called concurrently by page and sidebar shell)
  if (isCacheableGet) {
    const cached = recentGetCache.get(path);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
    const inFlight = inFlightRequests.get(path);
    if (inFlight) {
      return inFlight as Promise<T>;
    }
  }

  const requestGen = cacheGeneration;

  const exec = async (): Promise<T> => {
    try {
      const headers = new Headers(init?.headers || {});

      if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }

      if (isMutating) {
        const csrfToken = await ensureCsrfToken();
        if (csrfToken) {
          headers.set("X-CSRFToken", csrfToken);
        }
      }

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let signal = init?.signal;
      if (!signal && typeof AbortController !== "undefined") {
        const controller = new AbortController();
        timeoutId = setTimeout(
          () =>
            controller.abort(
              new Error("Request timed out. The server or remote database may be waking up; please retry.")
            ),
          45000
        );
        signal = controller.signal;
      }

      let res: Response;
      try {
        res = await fetch(resolveApiUrl(path), {
          ...init,
          method,
          headers,
          credentials: "include",
          signal,
        });
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }

      const contentType = res.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const data = isJson ? await res.json() : null;

      if (res.ok) {
        opts?.onHeaders?.(res.headers);
      }
      if (!res.ok) {
        let detail = "An unexpected error occurred.";
        let fieldErrors: Record<string, string[]> | undefined;

        if (data) {
          if (typeof data.detail === "string") {
            detail = data.detail;
          } else if (typeof data.error === "string") {
            detail = data.error;
          } else if (typeof data.message === "string") {
            detail = data.message;
          } else if (typeof data === "object") {
            fieldErrors = {};
            for (const [key, val] of Object.entries(data)) {
              if (Array.isArray(val)) {
                fieldErrors[key] = val.map(String);
              } else if (typeof val === "string") {
                fieldErrors[key] = [val];
              }
            }
            const firstKey = Object.keys(fieldErrors)[0];
            if (firstKey && fieldErrors[firstKey].length > 0) {
              detail = `${firstKey}: ${fieldErrors[firstKey][0]}`;
            }
          }
        }
        throw new ApiError(res.status, detail, fieldErrors, data && typeof data === "object" ? data : null);
      }

      if (isCacheableGet && requestGen === cacheGeneration) {
        recentGetCache.set(path, { data, expires: Date.now() + 2500 });
      }

      return data as T;
    } finally {
      if (isMutating) {
        invalidateApiGetCache();
      }
    }
  };

  if (isCacheableGet) {
    const promise = exec().finally(() => {
      if (inFlightRequests.get(path) === promise) {
        inFlightRequests.delete(path);
      }
    });
    inFlightRequests.set(path, promise);
    return promise;
  }

  return exec();
}

export async function requestEmailOtp(email: string) {
  return apiFetch<{
    detail: string;
    email?: string;
    resend_in_seconds?: number;
    expires_in_seconds: number;
  }>("/api/auth/otp/request/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

function clearActiveMerchantStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("shopcraft_active_store_slug");
    window.sessionStorage.removeItem("shopcraft_merchant_notice");
  } catch {
    // Storage unavailable
  }
}

export async function verifyEmailOtp(email: string, code: string) {
  const res = await apiFetch<{ user: UserProfile }>("/api/auth/otp/verify/", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  clearActiveMerchantStorage();
  invalidateApiGetCache();
  return res;
}

export async function authenticateWithGoogle(credential: string) {
  const res = await apiFetch<{ user: UserProfile }>("/api/auth/google/", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
  clearActiveMerchantStorage();
  invalidateApiGetCache();
  return res;
}

export async function fetchSession() {
  return apiFetch<{ authenticated: boolean; user: UserProfile | null }>("/api/auth/me/", {
    cache: "no-store",
  });
}

export async function updateProfile(data: { full_name?: string; phone?: string }) {
  return apiFetch<{ authenticated: boolean; user: UserProfile }>("/api/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function logoutSession() {
  try {
    return await apiFetch<{ detail: string }>("/api/auth/logout/", {
      method: "POST",
    });
  } finally {
    clearActiveMerchantStorage();
    invalidateApiGetCache();
  }
}

export async function listDeliveryAddresses() {
  return apiFetch<DeliveryAddressItem[]>("/api/auth/addresses/");
}

export async function createDeliveryAddress(data: DeliveryAddressPayload) {
  return apiFetch<DeliveryAddressItem>("/api/auth/addresses/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDeliveryAddress(id: number, data: Partial<DeliveryAddressPayload>) {
  return apiFetch<DeliveryAddressItem>(`/api/auth/addresses/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteDeliveryAddress(id: number) {
  return apiFetch<{ detail: string }>(`/api/auth/addresses/${id}/`, {
    method: "DELETE",
  });
}


export interface StorefrontCustomerProfile {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  orders_count: number;
  total_spent_minor: number;
}

export interface StorefrontAccountResponse {
  user: UserProfile;
  customer: StorefrontCustomerProfile | null;
}

export interface StorefrontOrderSummary {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_minor: number;
  created_at: string;
  items_summary: string;
  token: string;
}

export async function requestStorefrontOTP(storeSlug: string, email: string) {
  return apiFetch<{
    ok: boolean;
    detail: string;
    resend_in_seconds: number;
  }>(`/api/stores/${encodeURIComponent(storeSlug)}/account/otp/request/`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyStorefrontOTP(storeSlug: string, email: string, code: string) {
  return apiFetch<{
    ok: boolean;
    user: UserProfile;
    customer: StorefrontCustomerProfile;
  }>(`/api/stores/${encodeURIComponent(storeSlug)}/account/otp/verify/`, {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function verifyStorefrontGoogleAuth(storeSlug: string, credential: string) {
  return apiFetch<{
    ok: boolean;
    user: UserProfile;
    customer: StorefrontCustomerProfile;
  }>(`/api/stores/${encodeURIComponent(storeSlug)}/account/google/`, {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export async function fetchStorefrontAccount(
  storeSlug: string,
  options?: { lookupOnly?: boolean }
) {
  const qs = options?.lookupOnly ? "?lookup_only=1" : "";
  return apiFetch<StorefrontAccountResponse>(
    `/api/stores/${encodeURIComponent(storeSlug)}/account/${qs}`
  );
}

export async function updateStorefrontAccount(
  storeSlug: string,
  data: { full_name?: string; phone?: string }
) {
  return apiFetch<{
    ok: boolean;
    user: UserProfile;
    customer: StorefrontCustomerProfile;
  }>(`/api/stores/${encodeURIComponent(storeSlug)}/account/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function fetchStorefrontOrders(storeSlug: string) {
  return apiFetch<StorefrontOrderSummary[]>(
    `/api/stores/${encodeURIComponent(storeSlug)}/account/orders/`
  );
}

export async function fetchStorePublic(storeSlug: string) {
  return apiFetch<StorePublicMetadata>(`/api/stores/${storeSlug}/`);
}

export interface StoreCatalogResponse {
  products: ProductItem[];
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    has_more: boolean;
  };
}

export async function fetchStoreCatalog(
  storeSlug: string,
  params?: { page?: number; pageSize?: number; q?: string }
) {
  const qs = new URLSearchParams();
  if (params?.page && params.page > 1) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("page_size", String(params.pageSize));
  if (params?.q) qs.set("q", params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch<StoreCatalogResponse>(
    `/api/stores/${encodeURIComponent(storeSlug)}/catalog/${suffix}`
  );
}

export async function checkStoreSlug(slug: string) {
  return apiFetch<{ available: boolean; slug?: string; reason?: string }>(
    `/api/stores/check-slug/?slug=${encodeURIComponent(slug)}`
  );
}

export interface CreateStorePayload {
  name: string;
  slug: string;
  category?: string;
  city?: string;
  province?: string;
  address?: string;
  theme_preset: string;
  tagline?: string;
  contact_phone?: string;
}

export interface MerchantStoreMembership {
  id: number;
  name: string;
  slug: string;
  category: string;
  city: string;
  province: string;
  theme_preset: string;
  logo_url: string;
  accent_color: string;
  role: "OWNER" | "STAFF";
  created_at: string;
}

export async function fetchMyStores() {
  return apiFetch<{ stores: MerchantStoreMembership[] }>("/api/stores/my-stores/", {
    cache: "no-store",
  });
}

export async function createStore(payload: CreateStorePayload) {
  return apiFetch<StorePublicMetadata>("/api/stores/create/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface OverviewDailyPoint {
  date: string;
  label: string;
  revenue_minor: number;
  orders_count: number;
}

export interface OverviewRecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total_minor: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

export interface MerchantStoreOverview {
  store: StorePublicMetadata;
  member_role?: "OWNER" | "STAFF";
  products_count: number;
  orders_count: number;
  revenue_minor: number;
  customers_count: number;
  today_sales_minor?: number;
  today_orders_count?: number;
  pending_fulfillment_count?: number;
  cod_pending_minor?: number;
  active_discounts_count?: number;
  low_stock_variants_count?: number;
  out_of_stock_variants_count?: number;
  daily_sales_7d?: OverviewDailyPoint[];
  recent_orders?: OverviewRecentOrder[];
  checklist: {
    has_products: boolean;
    has_shipping: boolean;
    has_khalti: boolean;
    has_story?: boolean;
  };
}

export async function fetchMerchantStoreOverview(storeSlug: string) {
  return apiFetch<MerchantStoreOverview>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/overview/`
  );
}

export interface MerchantStoreSettings extends StorePublicMetadata {
  has_custom_khalti_key: boolean;
  khalti_mode: "TEST" | "LIVE";
  khalti_key_masked: string;
  cod_enabled: boolean;
  custom_domain: string;
  member_role?: "OWNER" | "STAFF";
}

export interface MerchantSettingsUpdatePayload {
  name?: string;
  tagline?: string;
  category?: string;
  city?: string;
  province?: string;
  contact_phone?: string;
  contact_email?: string;
  support_email?: string;
  address?: string;
  story_headline?: string;
  about_text?: string;
  banner_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  theme_preset?: string;
  accent_color?: string;
  logo_url?: string;
  inside_valley_shipping_minor?: number;
  outside_valley_shipping_minor?: number;
  free_shipping_threshold_minor?: number | null;
  shipping_configured?: boolean;
  cod_enabled?: boolean;
  custom_domain?: string;
  khalti_mode?: "TEST" | "LIVE";
  khalti_secret_key?: string;
  clear_khalti_secret_key?: boolean;
}

export async function fetchMerchantSettings(storeSlug: string) {
  return apiFetch<MerchantStoreSettings>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/settings/`
  );
}

export async function updateMerchantSettings(
  storeSlug: string,
  payload: MerchantSettingsUpdatePayload
) {
  return apiFetch<MerchantStoreSettings>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/settings/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export interface ThemeMediaUploadResponse {
  success: boolean;
  url: string;
  filename: string;
  public_id: string;
}

export async function uploadThemeMedia(
  storeSlug: string,
  file: File,
  assetType: "hero" | "logo"
): Promise<ThemeMediaUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("asset_type", assetType);

  return apiFetch<ThemeMediaUploadResponse>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/media/theme/upload/`,
    {
      method: "POST",
      body: formData,
    }
  );
}


export interface ProductVariant {
  id: number;
  sku: string;
  label: string;
  weight_grams: number | null;
  price_minor: number;
  allow_one_time: boolean;
  in_stock: boolean;
  track_inventory?: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
  is_low_stock?: boolean;
  is_out_of_stock?: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface ProductItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  category?: string;
  image_url: string;
  attributes: Record<string, unknown>;
  allow_one_time: boolean;
  is_active: boolean;
  sort_order: number;
  variants: ProductVariant[];
}

export interface ProductPayload {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  image_url?: string;
  attributes?: Record<string, string>;
  allow_one_time?: boolean;
  is_active?: boolean;
  sort_order?: number;
  initial_price_minor?: number;
  initial_variant_label?: string;
}

export interface MerchantProductsPage {
  products: ProductItem[];
  pagination: PaginationMeta;
  allCount: number;
  activeCount: number;
  draftCount: number;
}

export async function fetchMerchantProductsPage(
  storeSlug: string,
  params?: { status?: string; q?: string; page?: number; pageSize?: number }
): Promise<MerchantProductsPage> {
  const qs = new URLSearchParams();
  if (params?.status && params.status !== "all") qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  if (params?.page && params.page > 1) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("page_size", String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  let headers: Headers | null = null;
  const products = await apiFetch<ProductItem[]>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/products/${suffix}`,
    { cache: "no-store" },
    { onHeaders: (h) => (headers = h) }
  );
  const h = headers as Headers | null;
  const num = (name: string, fallback: number) => {
    const raw = h?.get(name);
    const parsed = raw === null || raw === undefined ? NaN : Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const page = num("X-Page", params?.page ?? 1);
  const pageSize = num("X-Page-Size", params?.pageSize ?? products.length);
  return {
    products,
    pagination: {
      total: num("X-Total-Count", products.length),
      page,
      page_size: pageSize,
      has_more: h?.get("X-Has-More") === "1",
    },
    allCount: num("X-All-Count", products.length),
    activeCount: num("X-Active-Count", products.filter((p) => p.is_active).length),
    draftCount: num("X-Draft-Count", products.filter((p) => !p.is_active).length),
  };
}

export async function fetchMerchantProducts(storeSlug: string) {
  return apiFetch<ProductItem[]>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/products/`
  );
}

export async function fetchMerchantProduct(storeSlug: string, productId: number) {
  return apiFetch<ProductItem>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/products/${productId}/`
  );
}

export async function createMerchantProduct(storeSlug: string, payload: ProductPayload) {
  return apiFetch<ProductItem>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/products/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateMerchantProduct(
  storeSlug: string,
  productId: number,
  payload: Partial<ProductPayload>
) {
  return apiFetch<ProductItem>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/products/${productId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteMerchantProduct(
  storeSlug: string,
  productId: number,
  permanent: boolean = false
) {
  const query = permanent ? "?permanent=true" : "";
  return apiFetch<{ detail: string; id?: number; is_active?: boolean }>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/products/${productId}/${query}`,
    {
      method: "DELETE",
    }
  );
}

export interface VariantPayload {
  label: string;
  sku?: string;
  price_minor: number;
  weight_grams?: number | null;
  allow_one_time?: boolean;
  in_stock?: boolean;
  track_inventory?: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface MerchantInventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image_url: string;
  label: string;
  sku: string;
  price_minor: number;
  in_stock: boolean;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  updated_at: string;
}

export interface MerchantInventoryResponse {
  summary: {
    total_variants: number;
    tracked_count: number;
    low_stock_count: number;
    out_of_stock_count: number;
    total_units: number;
  };
  items: MerchantInventoryItem[];
  pagination?: PaginationMeta;
}

export async function fetchMerchantInventory(
  storeSlug: string,
  params?: { status?: string; q?: string; page?: number; pageSize?: number }
) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.q) query.set("q", params.q);
  if (params?.page && params.page > 1) query.set("page", String(params.page));
  if (params?.pageSize) query.set("page_size", String(params.pageSize));
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<MerchantInventoryResponse>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/inventory/${qStr}`
  );
}

export async function fetchProductVariants(storeSlug: string, productId: number) {
  return apiFetch<ProductVariant[]>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/products/${productId}/variants/`
  );
}

export async function createProductVariant(
  storeSlug: string,
  productId: number,
  payload: VariantPayload
) {
  return apiFetch<ProductVariant>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/products/${productId}/variants/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateProductVariant(
  storeSlug: string,
  productId: number,
  variantId: number,
  payload: Partial<VariantPayload>
) {
  return apiFetch<ProductVariant>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/products/${productId}/variants/${variantId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteProductVariant(
  storeSlug: string,
  productId: number,
  variantId: number,
  permanent: boolean = false
) {
  const query = permanent ? "?permanent=true" : "";
  return apiFetch<{ detail: string; id?: number; is_active?: boolean }>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/products/${productId}/variants/${variantId}/${query}`,
    {
      method: "DELETE",
    }
  );
}

// -----------------------------------------------------------------------------
// Checkout & Order APIs
// -----------------------------------------------------------------------------

export interface CheckoutAddressPayload {
  recipient_name: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  ward: number | string;
  street_landmark: string;
}

export interface CheckoutQuotePayload {
  items: Array<{
    variant_id: number;
    quantity: number;
  }>;
  district?: string;
  discount_code?: string;
}

export interface CheckoutQuoteResponse {
  subtotal_minor: number;
  shipping_minor: number;
  discount_minor: number;
  discount_code?: string | null;
  total_minor: number;
  is_free_shipping: boolean;
  currency: string;
  items: Array<{
    variant_id: number;
    product_name: string;
    variant_label: string;
    unit_price_minor: number;
    quantity: number;
    line_total_minor: number;
  }>;
}

export interface CheckoutPlacePayload {
  items: Array<{
    variant_id: number;
    quantity: number;
  }>;
  shipping_address: CheckoutAddressPayload;
  customer_email?: string;
  payment_method: "KHALTI" | "COD";
  discount_code?: string;
  return_url?: string;
}

export interface CheckoutPlaceResponse {
  order_id: number;
  token?: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status?: string;
  total_minor?: number;
  pidx?: string;
  payment_url?: string;
  is_test?: boolean;
  is_mock?: boolean;
}

export interface KhaltiVerifyResponse {
  success: boolean;
  state?: "pending" | "failed" | "error" | string;
  order_id: number;
  token?: string;
  order_number?: string;
  status?: string;
  payment_status?: string;
  is_test?: boolean;
  error?: string;
  reason?: string;
}

export interface OrderItemDetail {
  id: number;
  product_name_snapshot: string;
  variant_label_snapshot: string;
  unit_price_minor: number;
  quantity: number;
  line_total_minor: number;
}

export interface OrderEventDetail {
  id: number;
  from_status: string;
  to_status: string;
  note: string;
  created_at: string;
}

export interface OrderDetail {
  id: number;
  token?: string;
  order_number: string;
  order_type: string;
  status: string;
  payment_method: "KHALTI" | "COD" | string;
  payment_status: string;
  payment_ref: string;
  is_test?: boolean;
  subtotal_minor: number;
  shipping_minor: number;
  discount_minor: number;
  total_minor: number;
  currency: string;
  shipping_address_snapshot: CheckoutAddressPayload;
  created_at: string;
  items: OrderItemDetail[];
  events: OrderEventDetail[];
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export async function fetchCheckoutQuote(
  storeSlug: string,
  payload: CheckoutQuotePayload
) {
  return apiFetch<CheckoutQuoteResponse>(
    `/api/stores/${encodeURIComponent(storeSlug)}/checkout/quote/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function placeCheckoutOrder(
  storeSlug: string,
  payload: CheckoutPlacePayload
) {
  return apiFetch<CheckoutPlaceResponse>(
    `/api/stores/${encodeURIComponent(storeSlug)}/checkout/place/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function verifyKhaltiPayment(
  storeSlug: string,
  pidx: string,
  orderId: number | string
) {
  return apiFetch<KhaltiVerifyResponse>(
    `/api/stores/${encodeURIComponent(storeSlug)}/checkout/khalti-verify/`,
    {
      method: "POST",
      body: JSON.stringify({ pidx, order_id: orderId }),
    }
  );
}

export interface PayPublicOrderResponse {
  order_id: number;
  token: string;
  order_number: string;
  status: string;
  payment_method?: string;
  payment_status?: string;
  pidx?: string;
  payment_url?: string;
  is_test?: boolean;
  is_mock?: boolean;
}

export async function payPublicOrder(
  storeSlug: string,
  orderId: number | string,
  payload: {
    token: string;
    payment_method: "KHALTI" | "COD";
    return_url?: string;
  }
) {
  return apiFetch<PayPublicOrderResponse>(
    `/api/stores/${encodeURIComponent(storeSlug)}/public-orders/${encodeURIComponent(String(orderId))}/pay/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function fetchPublicOrder(storeSlug: string, orderId: number | string) {
  return apiFetch<OrderDetail>(
    `/api/stores/${encodeURIComponent(storeSlug)}/public-orders/${orderId}/`
  );
}

export interface OrderQueueCounts {
  all: number;
  new: number;
  packed: number;
  shipped: number;
  delivered: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface MerchantOrdersResponse {
  orders: OrderDetail[];
  counts: OrderQueueCounts;
  pagination?: PaginationMeta;
}

export async function fetchMerchantOrders(
  storeSlug: string,
  params?: { status?: string; search?: string; page?: number; pageSize?: number }
) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.page && params.page > 1) query.set("page", String(params.page));
  if (params?.pageSize) query.set("page_size", String(params.pageSize));
  const qStr = query.toString() ? `?${query.toString()}` : "";

  return apiFetch<MerchantOrdersResponse>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/orders/${qStr}`
  );
}

export async function fetchMerchantOrderDetail(
  storeSlug: string,
  orderId: number | string
) {
  return apiFetch<OrderDetail>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/orders/${orderId}/`
  );
}

export async function transitionMerchantOrderStatus(
  storeSlug: string,
  orderId: number | string,
  payload: { to_status: string; note?: string }
) {
  return apiFetch<OrderDetail>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/orders/${orderId}/transition/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}


export interface MerchantCustomerItem {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  orders_count: number;
  total_spent_minor: number;
  city: string;
  has_account?: boolean;
  created_at: string;
}

export interface MerchantCustomerDetail {
  customer: MerchantCustomerItem;
  orders: OrderDetail[];
}

export interface MerchantCustomersPage {
  customers: MerchantCustomerItem[];
  pagination: PaginationMeta;
  repeatCustomers: number;
  totalSpentMinor: number;
}

export async function fetchMerchantCustomersPage(
  storeSlug: string,
  params?: { query?: string; page?: number; pageSize?: number }
): Promise<MerchantCustomersPage> {
  const qs = new URLSearchParams();
  if (params?.query) qs.set("q", params.query);
  if (params?.page && params.page > 1) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("page_size", String(params.pageSize));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  let headers: Headers | null = null;
  const customers = await apiFetch<MerchantCustomerItem[]>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/customers/${suffix}`,
    { cache: "no-store" },
    { onHeaders: (h) => (headers = h) }
  );
  const h = headers as Headers | null;
  const num = (name: string, fallback: number) => {
    const raw = h?.get(name);
    const parsed = raw === null || raw === undefined ? NaN : Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const page = num("X-Page", params?.page ?? 1);
  const pageSize = num("X-Page-Size", params?.pageSize ?? customers.length);
  return {
    customers,
    pagination: {
      total: num("X-Total-Count", customers.length),
      page,
      page_size: pageSize,
      has_more: h?.get("X-Has-More") === "1",
    },
    repeatCustomers: num("X-Repeat-Customers", customers.filter((c) => c.orders_count > 1).length),
    totalSpentMinor: num(
      "X-Total-Spent-Minor",
      customers.reduce((acc, c) => acc + (c.total_spent_minor || 0), 0)
    ),
  };
}

export async function fetchMerchantCustomers(storeSlug: string, query?: string) {
  const url = query
    ? `/api/merchant/stores/${encodeURIComponent(storeSlug)}/customers/?q=${encodeURIComponent(query)}`
    : `/api/merchant/stores/${encodeURIComponent(storeSlug)}/customers/`;
  return apiFetch<MerchantCustomerItem[]>(url);
}

export async function fetchMerchantCustomerDetail(storeSlug: string, customerId: number) {
  return apiFetch<MerchantCustomerDetail>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/customers/${customerId}/`
  );
}

// -----------------------------------------------------------------------------
// Slice 6: Analytics, Discounts, Staff RBAC & Audit Logs
// -----------------------------------------------------------------------------

export type AnalyticsRange = "7d" | "30d" | "90d" | "all";

export interface ProvinceBreakdownItem {
  province: string;
  orders_count: number;
  revenue_minor: number;
  share_pct: number;
}

export interface PaymentMixItem {
  method: "KHALTI" | "COD" | "PREPAID_CYCLE" | string;
  label: string;
  orders_count: number;
  revenue_minor: number;
  share_pct: number;
}

export interface TopProductMetricItem {
  product_name: string;
  units_sold: number;
  revenue_minor: number;
}

export interface MerchantAnalyticsResponse {
  range: AnalyticsRange;
  kpis: {
    gross_sales_minor: number;
    paid_sales_minor: number;
    cod_pending_minor: number;
    discounts_given_minor: number;
    orders_count: number;
    aov_minor: number;
    repeat_customer_rate_pct: number;
    total_customers: number;
    repeat_customers: number;
    active_mrr_minor: number;
  };
  daily_series: OverviewDailyPoint[];
  sales_by_province: ProvinceBreakdownItem[];
  payment_mix: PaymentMixItem[];
  top_products: TopProductMetricItem[];
}

export async function fetchMerchantAnalytics(
  storeSlug: string,
  range: AnalyticsRange = "30d"
) {
  return apiFetch<MerchantAnalyticsResponse>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/analytics/?range=${encodeURIComponent(range)}`
  );
}

export interface DiscountItem {
  id: number;
  code: string;
  description: string;
  discount_type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  min_subtotal_minor: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  is_expired: boolean;
  is_maxed?: boolean;
  created_at: string;
}

export interface MerchantDiscountsResponse {
  metrics: {
    active_count: number;
    total_redemptions: number;
    expired_count: number;
    maxed_count?: number;
  };
  discounts: DiscountItem[];
}

export interface CreateDiscountPayload {
  code: string;
  description?: string;
  discount_type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  min_subtotal_minor?: number;
  max_uses?: number | null;
  expires_at?: string | null;
  is_active?: boolean;
}

export async function fetchMerchantDiscounts(storeSlug: string) {
  return apiFetch<MerchantDiscountsResponse>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/discounts/`
  );
}

export async function createMerchantDiscount(
  storeSlug: string,
  payload: CreateDiscountPayload
) {
  return apiFetch<DiscountItem>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/discounts/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateMerchantDiscount(
  storeSlug: string,
  discountId: number,
  payload: Partial<CreateDiscountPayload>
) {
  return apiFetch<DiscountItem>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/discounts/${discountId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteMerchantDiscount(
  storeSlug: string,
  discountId: number
) {
  return apiFetch<{ detail: string; id?: number; is_active?: boolean }>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/discounts/${discountId}/`,
    {
      method: "DELETE",
    }
  );
}

export interface StaffMemberItem {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  role: "OWNER" | "STAFF";
  is_current_user: boolean;
  created_at: string;
}

export interface MerchantStaffResponse {
  current_role?: "OWNER" | "STAFF";
  current_user_role?: "OWNER" | "STAFF";
  members: StaffMemberItem[];
}

export async function fetchMerchantStaff(storeSlug: string) {
  return apiFetch<MerchantStaffResponse>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/staff/`
  );
}

export async function inviteMerchantStaff(
  storeSlug: string,
  payload: { email: string; full_name?: string; role: "OWNER" | "STAFF" }
) {
  return apiFetch<StaffMemberItem>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/staff/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateMerchantStaffRole(
  storeSlug: string,
  membershipId: number,
  role: "OWNER" | "STAFF"
) {
  return apiFetch<StaffMemberItem>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/staff/${membershipId}/`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }
  );
}

export async function removeMerchantStaff(
  storeSlug: string,
  membershipId: number
) {
  return apiFetch<{ detail: string }>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/staff/${membershipId}/`,
    {
      method: "DELETE",
    }
  );
}

export interface AuditLogItem {
  id: number;
  actor_email: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export async function fetchMerchantAuditLogs(storeSlug: string) {
  return apiFetch<AuditLogItem[]>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/audit-logs/`
  );
}
