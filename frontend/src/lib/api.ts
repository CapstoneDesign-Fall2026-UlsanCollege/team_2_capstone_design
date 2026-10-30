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
  currency: string;
  theme_preset: "editorial-warm" | "pahadi-sage" | "ktm-bold" | string;
  logo_url: string;
  accent_color: string;
  contact_phone: string;
  inside_valley_shipping_minor: number;
  outside_valley_shipping_minor: number;
  free_shipping_threshold_minor: number | null;
}

export class ApiError extends Error {
  status: number;
  detail: string;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, detail: string, fieldErrors?: Record<string, string[]>) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

export function formatNpr(amountMinor: number): string {
  const rupees = Math.round(amountMinor / 100);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(rupees);
  return `Rs. ${formatted}`;
}

export function sanitizeRedirectTarget(
  nextParam?: string | null,
  storeNameParam?: string | null
): string {
  if (storeNameParam && storeNameParam.trim()) {
    return `/merchant/new?name=${encodeURIComponent(storeNameParam.trim())}`;
  }
  if (!nextParam) {
    return "/account/addresses";
  }
  const clean = nextParam.trim();
  if (clean.startsWith("/") && !clean.startsWith("//") && !clean.startsWith("/\\")) {
    return clean;
  }
  return "/account/addresses";
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
    const res = await fetch("/api/auth/csrf/", {
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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();
  const headers = new Headers(init?.headers || {});

  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

  const res = await fetch(path, {
    ...init,
    method,
    headers,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    let detail = "An unexpected error occurred.";
    let fieldErrors: Record<string, string[]> | undefined;

    if (data) {
      if (typeof data.detail === "string") {
        detail = data.detail;
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
    throw new ApiError(res.status, detail, fieldErrors);
  }

  return data as T;
}

export async function requestEmailOtp(email: string) {
  return apiFetch<{
    detail: string;
    email: string;
    expires_in_seconds: number;
    dev_otp_hint?: string;
  }>("/api/auth/otp/request/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmailOtp(email: string, code: string) {
  return apiFetch<{ user: UserProfile }>("/api/auth/otp/verify/", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function authenticateWithGoogle(credential: string) {
  return apiFetch<{ user: UserProfile }>("/api/auth/google/", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export async function fetchSession() {
  return apiFetch<{ authenticated: boolean; user: UserProfile | null }>("/api/auth/me/");
}

export async function updateProfile(data: { full_name?: string; phone?: string }) {
  return apiFetch<{ authenticated: boolean; user: UserProfile }>("/api/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function logoutSession() {
  return apiFetch<{ detail: string }>("/api/auth/logout/", {
    method: "POST",
  });
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

export async function fetchStorePublic(storeSlug: string) {
  return apiFetch<StorePublicMetadata>(`/api/stores/${storeSlug}/`);
}

export interface StoreCatalogResponse {
  products: ProductItem[];
  selling_plans: SellingPlanItem[];
}

export async function fetchStoreCatalog(storeSlug: string) {
  return apiFetch<StoreCatalogResponse>(
    `/api/stores/${encodeURIComponent(storeSlug)}/catalog/`
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
  theme_preset: string;
  tagline?: string;
  contact_phone?: string;
}

export async function createStore(payload: CreateStorePayload) {
  return apiFetch<StorePublicMetadata>("/api/stores/create/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface MerchantStoreOverview {
  store: StorePublicMetadata;
  products_count: number;
  orders_count: number;
  revenue_minor: number;
  customers_count: number;
  checklist: {
    has_products: boolean;
    has_shipping: boolean;
    has_khalti: boolean;
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
}

export interface MerchantSettingsUpdatePayload {
  name?: string;
  tagline?: string;
  contact_phone?: string;
  theme_preset?: string;
  accent_color?: string;
  logo_url?: string;
  inside_valley_shipping_minor?: number;
  outside_valley_shipping_minor?: number;
  free_shipping_threshold_minor?: number | null;
  khalti_mode?: "TEST" | "LIVE";
  khalti_secret_key?: string;
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

export interface ProductVariant {
  id: number;
  sku: string;
  label: string;
  weight_grams: number | null;
  price_minor: number;
  allow_one_time: boolean;
  allow_subscription: boolean;
  in_stock: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface ProductItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  attributes: Record<string, any>;
  allow_one_time: boolean;
  allow_subscription: boolean;
  is_active: boolean;
  sort_order: number;
  variants: ProductVariant[];
}

export interface ProductPayload {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  attributes?: Record<string, string>;
  allow_one_time?: boolean;
  allow_subscription?: boolean;
  is_active?: boolean;
  sort_order?: number;
  initial_price_minor?: number;
  initial_variant_label?: string;
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
  allow_subscription?: boolean;
  in_stock?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface SellingPlanItem {
  id: number;
  code: string;
  name: string;
  interval_unit: "WEEK" | "MONTH";
  interval_count: number;
  commitment_cycles: number;
  discount_pct: number;
  is_prepaid: boolean;
  is_active: boolean;
  sort_order: number;
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

export async function fetchMerchantSellingPlans(storeSlug: string) {
  return apiFetch<SellingPlanItem[]>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/selling-plans/`
  );
}

export async function createMerchantSellingPlan(
  storeSlug: string,
  payload: Partial<SellingPlanItem>
) {
  return apiFetch<SellingPlanItem>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/selling-plans/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
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
    purchase_type?: "one_time" | "subscription";
    selling_plan_id?: number | null;
  }>;
  district?: string;
}

export interface CheckoutQuoteResponse {
  subtotal_minor: number;
  shipping_minor: number;
  discount_minor: number;
  total_minor: number;
  is_free_shipping: boolean;
  has_prepaid_subscription: boolean;
  currency: string;
  items: Array<{
    variant_id: number;
    product_name: string;
    variant_label: string;
    unit_price_minor: number;
    quantity: number;
    line_total_minor: number;
    purchase_type: string;
    selling_plan?: string | null;
  }>;
}

export interface CheckoutPlacePayload {
  items: Array<{
    variant_id: number;
    quantity: number;
    purchase_type?: "one_time" | "subscription";
    selling_plan_id?: number | null;
  }>;
  shipping_address: CheckoutAddressPayload;
  customer_email?: string;
  payment_method: "KHALTI" | "COD";
  return_url?: string;
}

export interface CheckoutPlaceResponse {
  order_id: number;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status?: string;
  total_minor?: number;
  pidx?: string;
  payment_url?: string;
  is_sandbox?: boolean;
}

export interface KhaltiVerifyResponse {
  success: boolean;
  order_id: number;
  order_number: string;
  status: string;
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
  order_number: string;
  order_type: string;
  status: string;
  payment_method: "KHALTI" | "COD" | string;
  payment_status: string;
  payment_ref: string;
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

export interface MerchantOrdersResponse {
  orders: OrderDetail[];
  counts: OrderQueueCounts;
}

export async function fetchMerchantOrders(
  storeSlug: string,
  params?: { status?: string; search?: string }
) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
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


export interface SubscriptionItem {
  id: number;
  status: "ACTIVE" | "PAUSED" | "CANCELLED" | "COMPLETED" | "PENDING_PAYMENT";
  unit_price_minor: number;
  next_delivery_date: string;
  cycles_total: number | null;
  cycles_remaining: number | null;
  shipping_address_snapshot: Record<string, string>;
  variant_label: string;
  product_name: string;
  plan_name: string;
  plan_code: string;
  is_prepaid: boolean;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

export interface SubscriptionMetrics {
  active_count: number;
  paused_count: number;
  completed_count: number;
  cancelled_count: number;
  mrr_minor: number;
}

export interface MerchantSubscriptionsResponse {
  metrics: SubscriptionMetrics;
  subscriptions: SubscriptionItem[];
}

export async function fetchMerchantSubscriptions(
  storeSlug: string,
  params?: { status?: string; q?: string }
) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "ALL") query.set("status", params.status);
  if (params?.q) query.set("q", params.q);
  const qStr = query.toString() ? `?${query.toString()}` : "";

  return apiFetch<MerchantSubscriptionsResponse>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/subscriptions/${qStr}`
  );
}

export async function performMerchantSubscriptionAction(
  storeSlug: string,
  subId: number,
  action: "pause" | "resume" | "skip_cycle" | "cancel"
) {
  return apiFetch<SubscriptionItem>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/subscriptions/${subId}/action/`,
    {
      method: "POST",
      body: JSON.stringify({ action }),
    }
  );
}

export async function runMerchantSubscriptionCycles(
  storeSlug: string,
  targetDate?: string
) {
  return apiFetch<{ success: boolean; orders_generated: number; completed_subscriptions: number }>(
    `/api/merchant/stores/${encodeURIComponent(storeSlug)}/subscriptions/run-cycles/`,
    {
      method: "POST",
      body: JSON.stringify({ target_date: targetDate }),
    }
  );
}

export async function fetchShopperSubscriptions(storeSlug: string) {
  return apiFetch<SubscriptionItem[]>(
    `/api/stores/${encodeURIComponent(storeSlug)}/subscriptions/`
  );
}

export async function performShopperSubscriptionAction(
  storeSlug: string,
  subId: number,
  action: "pause" | "resume" | "skip_cycle" | "cancel"
) {
  return apiFetch<SubscriptionItem>(
    `/api/stores/${encodeURIComponent(storeSlug)}/subscriptions/${subId}/action/`,
    {
      method: "POST",
      body: JSON.stringify({ action }),
    }
  );
}
