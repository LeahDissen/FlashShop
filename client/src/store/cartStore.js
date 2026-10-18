import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveCartToDB, fetchCartFromDB } from '../api/cart';
import useAuthStore from './authStore';
import useToastStore from './toastStore';
import { prepareCartDisplayImage } from '../utils/cartThumbnail';
import { normalizeCartItem, assignCartLineIds, applyQuantityToCartItem, compactCustomDesignForCart } from '../utils/cartItem';

export const CART_ADDED_MESSAGE = 'המוצר נוסף לסל בהצלחה!';

const compactCartItem = (item) => {
  const compactCustomDesign = compactCustomDesignForCart(item?.customDesign);

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

      /** מוסיף פריטים לסל ומציג ללקוח אישור. אפשר להחליף את נוסח האישור דרך successMessage */
      addToCart: async (newItems, { successMessage = CART_ADDED_MESSAGE } = {}) => {
          const preparedItems = await prepareCartItems(newItems);
          set((state) => {
              const updatedCart = assignCartLineIds([...state.cartItems, ...preparedItems]);
              const userId = useAuthStore.getState().userId;
              if (userId) {
                  saveCartToDB(userId, updatedCart);
              }
              
              return { cartItems: updatedCart };
          });
          useToastStore.getState().showToast(successMessage);
      },

      /** מעדכן מחיר של פריטים שכבר בסל (למשל מדרגת מחיר של תמונות אחרי שנוספו עוד). getPrice מחזיר undefined = בלי שינוי */
      repriceItems: (getPrice) => {
          set((state) => {
              let changed = false;
              const updatedCart = state.cartItems.map((item) => {
                  const price = getPrice(item);
                  if (price === undefined || price === item.price) return item;
                  changed = true;
                  return { ...item, price };
              });
              if (!changed) return state;
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
