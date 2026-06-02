import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveCartToDB, fetchCartFromDB } from '../api/cart';
import useAuthStore from './authStore';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      loadCart: async (userId) => {
          const dbItems = await fetchCartFromDB(userId);
          if (dbItems && dbItems.length > 0) {
              set({ cartItems: dbItems });
          }
      },

      addToCart: (newItems) => {
          set((state) => {
              const updatedCart = [...state.cartItems, ...newItems];
              const userId = useAuthStore.getState().userId;
              if (userId) {
                  saveCartToDB(userId, updatedCart);
              }
              
              return { cartItems: updatedCart };
          });
      },

      removeFromCart: (itemId) => {
          set((state) => {
              const updatedCart = state.cartItems.filter((item) => item.id !== itemId && item._id !== itemId);
              const userId = useAuthStore.getState().userId;
              if (userId) {
                  saveCartToDB(userId, updatedCart);
              }

              return { cartItems: updatedCart };
          });
      },

      updateItemQuantity: (itemId, delta) => {
          set((state) => {
              const updatedCart = state.cartItems
                  .map((item) => {
                      if (item.id !== itemId && item._id !== itemId) return item;
                      const newQty = item.quantity + delta;
                      if (newQty < 1) return null;
                      return { ...item, quantity: newQty };
                  })
                  .filter(Boolean);

              const userId = useAuthStore.getState().userId;
              if (userId) {
                  saveCartToDB(userId, updatedCart);
              }

              return { cartItems: updatedCart };
          });
      },

      clearCart: () => {
          set({ cartItems: [] });
          const userId = useAuthStore.getState().userId;
          if (userId) {
              saveCartToDB(userId, []); 
          }
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);