/**
 * ShopCraft Tenant-Scoped Shopping Cart Manager
 *
 * All cart state is strictly isolated per tenant using the localStorage key
 * pattern: `sc:${storeSlug}:cart`. This guarantees zero cross-store item
 * leakage when a shopper navigates between different merchant storefronts.
 */

export interface CartItemSellingPlan {
  id: number;
  code: string;
  name: string;
  commitmentCycles: number;
  discountPct: number;
  isPrepaid: boolean;
}

export interface CartItem {
  variantId: number;
  productId: number;
  productSlug: string;
  productName: string;
  variantLabel: string;
  unitPriceMinor: number;
  quantity: number;
  imageUrl?: string;
  purchaseType: "one_time" | "subscription";
  sellingPlan?: CartItemSellingPlan | null;
}

export interface CartState {
  storeSlug: string;
  items: CartItem[];
  subtotalMinor: number;
  itemCount: number;
  updatedAt: number;
}

function getStorageKey(storeSlug: string): string {
  return `sc:${storeSlug}:cart`;
}

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    // If prepaid subscription, total per line item includes cycles
    if (item.purchaseType === "subscription" && item.sellingPlan?.isPrepaid) {
      return (
        sum +
        item.unitPriceMinor * item.sellingPlan.commitmentCycles * item.quantity
      );
    }
    return sum + item.unitPriceMinor * item.quantity;
  }, 0);
}

function calculateItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function matchesItem(
  existing: CartItem,
  variantId: number,
  purchaseType: "one_time" | "subscription",
  sellingPlanId?: number | null
): boolean {
  if (existing.variantId !== variantId) return false;
  if (existing.purchaseType !== purchaseType) return false;
  const existingPlanId = existing.sellingPlan ? existing.sellingPlan.id : null;
  const targetPlanId = sellingPlanId ?? null;
  return existingPlanId === targetPlanId;
}

/**
 * Retrieve the current cart state for a given store.
 */
export function getCart(storeSlug: string): CartState {
  if (typeof window === "undefined") {
    return {
      storeSlug,
      items: [],
      subtotalMinor: 0,
      itemCount: 0,
      updatedAt: Date.now(),
    };
  }

  try {
    const raw = localStorage.getItem(getStorageKey(storeSlug));
    if (!raw) {
      return {
        storeSlug,
        items: [],
        subtotalMinor: 0,
        itemCount: 0,
        updatedAt: Date.now(),
      };
    }

    const parsed = JSON.parse(raw);
    const items: CartItem[] = Array.isArray(parsed.items) ? parsed.items : [];
    return {
      storeSlug,
      items,
      subtotalMinor: calculateSubtotal(items),
      itemCount: calculateItemCount(items),
      updatedAt: parsed.updatedAt || Date.now(),
    };
  } catch {
    return {
      storeSlug,
      items: [],
      subtotalMinor: 0,
      itemCount: 0,
      updatedAt: Date.now(),
    };
  }
}

/**
 * Save cart items to local storage scoped to the store slug.
 */
function saveCart(storeSlug: string, items: CartItem[]): CartState {
  const state: CartState = {
    storeSlug,
    items,
    subtotalMinor: calculateSubtotal(items),
    itemCount: calculateItemCount(items),
    updatedAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        getStorageKey(storeSlug),
        JSON.stringify({ items, updatedAt: state.updatedAt })
      );
    } catch {
      // LocalStorage quota or privacy mode error
    }
  }

  return state;
}

/**
 * Add or increment an item in the tenant's cart.
 */
export function addToCart(storeSlug: string, newItem: CartItem): CartState {
  const current = getCart(storeSlug);
  const items = [...current.items];

  const planId = newItem.sellingPlan ? newItem.sellingPlan.id : null;
  const existingIndex = items.findIndex((i) =>
    matchesItem(i, newItem.variantId, newItem.purchaseType, planId)
  );

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      quantity: items[existingIndex].quantity + newItem.quantity,
      unitPriceMinor: newItem.unitPriceMinor, // Refresh unit price
    };
  } else {
    items.push(newItem);
  }

  return saveCart(storeSlug, items);
}

/**
 * Update the quantity of a specific cart item. If quantity <= 0, item is removed.
 */
export function updateCartItemQuantity(
  storeSlug: string,
  variantId: number,
  purchaseType: "one_time" | "subscription",
  sellingPlanId: number | null | undefined,
  quantity: number
): CartState {
  const current = getCart(storeSlug);

  if (quantity <= 0) {
    return removeFromCart(storeSlug, variantId, purchaseType, sellingPlanId);
  }

  const items = current.items.map((item) => {
    if (matchesItem(item, variantId, purchaseType, sellingPlanId)) {
      return { ...item, quantity };
    }
    return item;
  });

  return saveCart(storeSlug, items);
}

/**
 * Remove an item from the tenant's cart.
 */
export function removeFromCart(
  storeSlug: string,
  variantId: number,
  purchaseType: "one_time" | "subscription",
  sellingPlanId?: number | null
): CartState {
  const current = getCart(storeSlug);
  const items = current.items.filter(
    (item) => !matchesItem(item, variantId, purchaseType, sellingPlanId)
  );
  return saveCart(storeSlug, items);
}

/**
 * Clear the entire cart for a given store.
 */
export function clearCart(storeSlug: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(getStorageKey(storeSlug));
    } catch {
      // Ignore
    }
  }
}
