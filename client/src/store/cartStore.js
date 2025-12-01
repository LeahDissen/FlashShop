import { create } from 'zustand';

export const useCartStore = create((set) => ({
  cartItems: [],
  
  // Add items to cart
  addToCart: (newItems) => set((state) => {
    // You can add logic here to merge duplicates if needed
    return { cartItems: [...state.cartItems, ...newItems] };
  }),

  // Remove item from cart
  removeFromCart: (itemId) => set((state) => ({
    cartItems: state.cartItems.filter((item) => item.id !== itemId),
  })),

  // Clear cart
  clearCart: () => set({ cartItems: [] }),
}));