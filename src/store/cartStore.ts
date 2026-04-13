import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image_urls?: string[];
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        });
      },
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: (state.items || [])
            .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Helper functions for components to use instead of store methods
export const getCartTotal = (items: CartItem[]) => 
  items.reduce((total, item) => total + item.price * item.quantity, 0);

export const getCartCount = (items: CartItem[]) => 
  items.reduce((total, item) => total + item.quantity, 0);

