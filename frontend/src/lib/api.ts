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
