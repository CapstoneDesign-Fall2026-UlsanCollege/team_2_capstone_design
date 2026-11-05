/**
 * ShopCraft Tenant-Scoped Shopping Cart Manager
 *
 * All cart state is strictly isolated per tenant using the localStorage key
 * pattern: `sc:${storeSlug}:cart`. This guarantees zero cross-store item
 * leakage when a shopper navigates between different merchant storefronts.
 */

export interface CartItem {
  variantId: number;
  productId: number;
  productSlug: string;
  productName: string;
  variantLabel: string;
  unitPriceMinor: number;
  quantity: number;
  imageUrl?: string;
  purchaseType?: "one_time" | "subscription";
  sellingPlan?: any;
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
  return items.reduce((sum, item) => sum + item.unitPriceMinor * item.quantity, 0);
}

function calculateItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
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

  const existingIndex = items.findIndex((i) => i.variantId === newItem.variantId);

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      quantity: items[existingIndex].quantity + newItem.quantity,
      unitPriceMinor: newItem.unitPriceMinor,
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
  quantity: number
): CartState {
  const current = getCart(storeSlug);

  if (quantity <= 0) {
    return removeFromCart(storeSlug, variantId);
  }

  const items = current.items.map((item) => {
    if (item.variantId === variantId) {
      return { ...item, quantity };
    }
    return item;
  });

  return saveCart(storeSlug, items);
}

/**
 * Remove an item from the tenant's cart.
 */
export function removeFromCart(storeSlug: string, variantId: number): CartState {
  const current = getCart(storeSlug);
  const items = current.items.filter((item) => item.variantId !== variantId);
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
