"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addToCart,
  CartItem,
  clearCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
} from "@/lib/cart";

export interface CartContextValue {
  storeSlug: string;
  items: CartItem[];
  itemCount: number;
  subtotalMinor: number;
  isCartOpen: boolean;
  freeShippingThresholdMinor?: number | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  updateQty: (
    variantId: number,
    purchaseType: "one_time" | "subscription",
    sellingPlanId: number | null | undefined,
    quantity: number
  ) => void;
  removeItem: (
    variantId: number,
    purchaseType: "one_time" | "subscription",
    sellingPlanId?: number | null
  ) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export interface CartProviderProps {
  storeSlug: string;
  freeShippingThresholdMinor?: number | null;
  children: React.ReactNode;
}

export function CartProvider({
  storeSlug,
  freeShippingThresholdMinor = null,
  children,
}: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotalMinor, setSubtotalMinor] = useState<number>(0);
  const [itemCount, setItemCount] = useState<number>(0);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Sync state from client storage on mount or store change (React 19 safe async microtask)
  useEffect(() => {
    Promise.resolve().then(() => {
      const initialCart = getCart(storeSlug);
      setItems(initialCart.items);
      setSubtotalMinor(initialCart.subtotalMinor);
      setItemCount(initialCart.itemCount);
    });
  }, [storeSlug]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const addItem = useCallback(
    (newItem: CartItem) => {
      const next = addToCart(storeSlug, newItem);
      setItems(next.items);
      setSubtotalMinor(next.subtotalMinor);
      setItemCount(next.itemCount);
      setIsCartOpen(true);
    },
    [storeSlug]
  );

  const updateQty = useCallback(
    (
      variantId: number,
      purchaseType: "one_time" | "subscription",
      sellingPlanId: number | null | undefined,
      quantity: number
    ) => {
      const next = updateCartItemQuantity(
        storeSlug,
        variantId,
        purchaseType,
        sellingPlanId,
        quantity
      );
      setItems(next.items);
      setSubtotalMinor(next.subtotalMinor);
      setItemCount(next.itemCount);
    },
    [storeSlug]
  );

  const removeItem = useCallback(
    (
      variantId: number,
      purchaseType: "one_time" | "subscription",
      sellingPlanId?: number | null
    ) => {
      const next = removeFromCart(storeSlug, variantId, purchaseType, sellingPlanId);
      setItems(next.items);
      setSubtotalMinor(next.subtotalMinor);
      setItemCount(next.itemCount);
    },
    [storeSlug]
  );

  const clear = useCallback(() => {
    clearCart(storeSlug);
    setItems([]);
    setSubtotalMinor(0);
    setItemCount(0);
  }, [storeSlug]);

  const value = useMemo<CartContextValue>(
    () => ({
      storeSlug,
      items,
      itemCount,
      subtotalMinor,
      isCartOpen,
      freeShippingThresholdMinor,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      updateQty,
      removeItem,
      clear,
    }),
    [
      storeSlug,
      items,
      itemCount,
      subtotalMinor,
      isCartOpen,
      freeShippingThresholdMinor,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      updateQty,
      removeItem,
      clear,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
