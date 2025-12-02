import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveCartToDB, fetchCartFromDB } from '../api/cart'; // Import the API helpers
import useAuthStore from './authStore'; // We need to check if user is logged in

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],

      // --- NEW: Action to load cart from DB (call this on Login) ---
      loadCart: async (userId) => {
          const dbItems = await fetchCartFromDB(userId);
          if (dbItems && dbItems.length > 0) {
              set({ cartItems: dbItems });
          }
      },

      addToCart: (newItems) => {
          set((state) => {
              const updatedCart = [...state.cartItems, ...newItems];
              
              // Sync with DB if user is logged in
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
              
              // Sync with DB if user is logged in
              const userId = useAuthStore.getState().userId;
              if (userId) {
                  saveCartToDB(userId, updatedCart);
              }

              return { cartItems: updatedCart };
          });
      },

      clearCart: () => {
          set({ cartItems: [] });
          // Optional: Clear DB pending order too if you want
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