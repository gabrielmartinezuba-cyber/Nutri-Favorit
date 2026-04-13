'use client';

import { useCartStore, getCartCount, getCartTotal, CartItem } from './cartStore';
import { useState, useEffect } from 'react';

export function useCart() {
  const [hydrated, setHydrated] = useState(false);
  const cart = useCartStore();

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Return consistent empty state until hydration is complete on client
  if (!hydrated) {
    return {
      items: [] as CartItem[],
      addItem: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      totalItems: 0,
      totalPrice: 0,
      isHydrated: false,
    };
  }

  return {
    ...cart,
    totalItems: getCartCount(cart.items),
    totalPrice: getCartTotal(cart.items),
    isHydrated: true,
  };
}
