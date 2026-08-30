import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveCartToDB, fetchCartFromDB } from '../api/cart';
import useAuthStore from './authStore';
import { prepareCartDisplayImage } from '../utils/cartThumbnail';
import { normalizeCartItem, assignCartLineIds, applyQuantityToCartItem } from '../utils/cartItem';

const compactCartItem = (item) => {
  const compactCustomDesign = item?.customDesign
    ? {
        projectId: item.customDesign.projectId,
        projectName: item.customDesign.projectName,
        canvasSize: item.customDesign.canvasSize,
        printSizeCm: item.customDesign.printSizeCm,
      }
    : undefined;

  return {
    ...item,
    productId: item.productId || item.product_id || undefined,
    itemType: item.itemType,
    customDesign: compactCustomDesign,
  };
};

const prepareCartItems = async (items) =>
  Promise.all(
    items.map(async (item) => {
      const normalized = normalizeCartItem(item);
      const image = await prepareCartDisplayImage(normalized.image);
      return compactCartItem({ ...normalized, image });
    }),
  );

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      loadCart: async (userId) => {
          const dbItems = await fetchCartFromDB(userId);
          if (dbItems && dbItems.length > 0) {
              set({ cartItems: assignCartLineIds(dbItems.map((item) => normalizeCartItem(item))) });
          }
      },

      resetCartLocal: () => {
          set({ cartItems: [] });
      },

      addToCart: async (newItems) => {
          const preparedItems = await prepareCartItems(newItems);
          set((state) => {
              const updatedCart = assignCartLineIds([...state.cartItems, ...preparedItems]);
              const userId = useAuthStore.getState().userId;
              if (userId) {
                  saveCartToDB(userId, updatedCart);
              }
              
              return { cartItems: updatedCart };
          });
      },

      removeFromCart: (itemId) => {
          if (!itemId) return;

          set((state) => {
              const updatedCart = state.cartItems.filter((item) => item.id !== itemId);
              const userId = useAuthStore.getState().userId;
              if (userId) {
                  saveCartToDB(userId, updatedCart);
              }

              return { cartItems: updatedCart };
          });
      },

      updateItemQuantity: (itemId, delta) => {
          if (!itemId) return;

          set((state) => {
              const updatedCart = state.cartItems
                  .map((item) => {
                      if (item.id !== itemId) return item;
                      const newQty = item.quantity + delta;
                      if (newQty < 1) return null;
                      return applyQuantityToCartItem(item, newQty);
                  })
                  .filter(Boolean);

              const userId = useAuthStore.getState().userId;
              if (userId) {
                  saveCartToDB(userId, updatedCart);
              }

              return { cartItems: updatedCart };
          });
      },

      setItemQuantity: (itemId, quantity) => {
          if (!itemId) return;
          const qty = Math.min(9999, Math.max(1, Math.floor(Number(quantity)) || 1));

          set((state) => {
              const updatedCart = state.cartItems.map((item) =>
                  item.id === itemId ? applyQuantityToCartItem(item, qty) : item,
              );

              const userId = useAuthStore.getState().userId;
              if (userId) {
                  saveCartToDB(userId, updatedCart);
              }

              return { cartItems: updatedCart };
          });
      },

      clearCart: async () => {
          set({ cartItems: [] });
          const userId = useAuthStore.getState().userId;
          if (userId) {
              await saveCartToDB(userId, []);
          }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        cartItems: assignCartLineIds(state.cartItems).map((item) => compactCartItem(item)),
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.cartItems?.length) {
          state.cartItems = assignCartLineIds(state.cartItems);
        }
      },
    }
  )
);
