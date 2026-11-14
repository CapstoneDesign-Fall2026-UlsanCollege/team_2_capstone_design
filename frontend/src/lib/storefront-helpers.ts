import type { ProductItem, StorePublicMetadata } from "./api";

const PLACEHOLDER_TEXT_VALUES = new Set([
  "",
  "none",
  "null",
  "undefined",
  "general",
  "specialty goods",
  "general specialty goods",
  "aaa",
  "placeholder",
  "online storefront · nepal",
  "online storefront",
  "official online store",
  "storefront",
]);

export function isPlaceholderText(text?: string | null): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_TEXT_VALUES.has(trimmed.toLowerCase());
}

export function cleanStoreCategory(category?: string | null): string {
  if (isPlaceholderText(category)) return "";
  return (category || "").trim();
}

export function sanitizeStorefrontImageUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("/images/products/placeholder.svg") ||
    lower.startsWith("/images/banners/")
  ) {
    return "";
  }
  return trimmed;
}

export function buildWhatsAppUrl(
  contactPhone?: string | null,
  storeName?: string | null
): string | null {
  if (!contactPhone) return null;
  const trimmed = contactPhone.trim();
  if (!trimmed || trimmed === "9801234567") return null;
  const clean = trimmed.replace(/\D/g, "").replace(/^0+/, "");
  if (!clean) return null;
  const phoneWithCountry = clean.startsWith("977") ? clean : `977${clean}`;
  const greeting = storeName?.trim()
    ? `Hi ${storeName.trim()}, I have an inquiry about your products.`
    : "Hello! I have an inquiry about your products.";
  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(greeting)}`;
}

export interface StorefrontContactDetails {
  whatsappUrl: string | null;
  telHref: string | null;
  phoneDisplay: string | null;
  email: string | null;
  mailtoHref: string | null;
  address: string | null;
  hasAnyDetail: boolean;
  hasAnyContact: boolean;
}

export function resolveStorefrontContactDetails(
  store: Partial<StorePublicMetadata>
): StorefrontContactDetails {
  const whatsappUrl = buildWhatsAppUrl(store.contact_phone, store.name);

  const rawPhone =
    store.contact_phone && store.contact_phone.trim() !== "9801234567"
      ? store.contact_phone.trim()
      : "";
  const cleanDigits = rawPhone.replace(/\D/g, "").replace(/^0+/, "");
  const phoneWithCountry = cleanDigits
    ? cleanDigits.startsWith("977")
      ? cleanDigits
      : `977${cleanDigits}`
    : "";
  const localDigits = phoneWithCountry.startsWith("977")
    ? phoneWithCountry.slice(3)
    : phoneWithCountry;

  const telHref = phoneWithCountry ? `tel:+${phoneWithCountry}` : null;
  const phoneDisplay = localDigits ? `+977 ${localDigits}` : null;

  const rawEmail = (store.support_email || store.contact_email || "").trim();
  const email = rawEmail || null;
  const mailtoHref = email ? `mailto:${email}` : null;

  const rawAddress = (store.address || "").trim();
  const address = isPlaceholderText(rawAddress) ? null : rawAddress;

  const hasAnyDetail = Boolean(telHref || mailtoHref || address);
  const hasAnyContact = Boolean(whatsappUrl || hasAnyDetail);

  return {
    whatsappUrl,
    telHref,
    phoneDisplay,
    email,
    mailtoHref,
    address,
    hasAnyDetail,
    hasAnyContact,
  };
}

export interface StorefrontClaims {
  shippingConfigured: boolean;
  hasKhalti: boolean;
  codEnabled: boolean;
  hasWhatsApp: boolean;
  waUrl: string | null;
  heroPromiseLine: string | null;
}

export function getStorefrontPaymentAndDeliveryClaims(
  store: Partial<StorePublicMetadata>
): StorefrontClaims {
  const shippingConfigured = Boolean(store.shipping_configured);
  const hasKhalti = Boolean(store.has_khalti);
  const codEnabled = Boolean(store.cod_enabled);
  const waUrl = buildWhatsAppUrl(store.contact_phone, store.name);
  const hasWhatsApp = Boolean(waUrl);

  const parts: string[] = [];
  if (shippingConfigured) {
    parts.push("Kathmandu Valley 1-2 days", "Nationwide courier");
  }
  if (hasKhalti && codEnabled) {
    parts.push("Khalti or Cash on Delivery");
  } else if (hasKhalti) {
    parts.push("Khalti ePayment");
  } else if (codEnabled) {
    parts.push("Cash on Delivery");
  }

  return {
    shippingConfigured,
    hasKhalti,
    codEnabled,
    hasWhatsApp,
    waUrl,
    heroPromiseLine: parts.length > 0 ? parts.join(" · ") : null,
  };
}

export function getStorefrontAccountBadge(
  isAuthenticated: boolean,
  customer?: { id?: number | null; full_name?: string | null; email?: string | null } | null
): { isStorefrontCustomer: boolean; userInitial: string | null } {
  const isStorefrontCustomer = Boolean(
    isAuthenticated && customer && typeof customer.id === "number" && customer.id > 0
  );
  if (!isStorefrontCustomer) {
    return { isStorefrontCustomer: false, userInitial: null };
  }
  const source = (customer?.full_name || customer?.email || "").trim();
  const initial = source ? source[0].toUpperCase() : null;
  return { isStorefrontCustomer: true, userInitial: initial };
}

export function buildThemePreviewDemoProducts(store: Partial<StorePublicMetadata>): ProductItem[] {
  const category = cleanStoreCategory(store.category);
  const baseAttributes = category ? { category } : {};

  return [
    {
      id: -101,
      slug: "preview-ceramic-vessel",
      name: "Handcrafted Stoneware Vessel",
      description: "Preview product — visible only inside the theme editor preview.",
      image_url:
        "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
      category: category || undefined,
      attributes: baseAttributes,
      allow_one_time: true,
      is_active: true,
      sort_order: 0,
      variants: [
        {
          id: -1001,
          sku: "PREVIEW-01",
          label: "Standard Edition",
          weight_grams: null,
          price_minor: 145000,
          allow_one_time: true,
          in_stock: true,
          is_active: true,
          sort_order: 0,
        },
      ],
    },
    {
      id: -102,
      slug: "preview-linen-throw",
      name: "Himalayan Loom Cotton Throw",
      description: "Preview product — visible only inside the theme editor preview.",
      image_url:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      category: category || undefined,
      attributes: baseAttributes,
      allow_one_time: true,
      is_active: true,
      sort_order: 1,
      variants: [
        {
          id: -1002,
          sku: "PREVIEW-02",
          label: "Natural",
          weight_grams: null,
          price_minor: 220000,
          allow_one_time: true,
          in_stock: true,
          is_active: true,
          sort_order: 0,
        },
      ],
    },
  ];
}
