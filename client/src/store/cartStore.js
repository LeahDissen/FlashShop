import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveCartToDB, fetchCartFromDB } from '../api/cart';
import { getPhotoPricing } from '../api/photo';
import { getPrintsBySize, getPhotoUnitPrice, normalizeSize } from '../utils/photoQuantityPricing';
import useAuthStore from './authStore';
import useToastStore from './toastStore';
import { prepareCartDisplayImage } from '../utils/cartThumbnail';
import { normalizeCartItem, assignCartLineIds, applyQuantityToCartItem, compactCustomDesignForCart, mergeGuestCart } from '../utils/cartItem';

export const CART_ADDED_MESSAGE = 'המוצר נוסף לסל בהצלחה!';

/** Owner of a cart saved before carts tracked their owner: unknown, so it is never merged into an account */
const UNKNOWN_OWNER = 'unknown';

export const isPhotoPrint = (item) => item?.itemType === 'photo-print';

/**
 * Photo prices depend on how many prints of each size are in the cart, so after merging two carts
 * that both have photos, the per-photo price is recalculated (the server prices the order the same way).
 */
const repricePhotos = async (items) => {
    const pricing = await getPhotoPricing().catch(() => null);
    if (!pricing) return items;
    const printsBySize = getPrintsBySize(items.filter(isPhotoPrint));
    return items.map((item) => (isPhotoPrint(item)
        ? { ...item, price: getPhotoUnitPrice(pricing, item.size, printsBySize[normalizeSize(item.size)]) }
        : item));
};

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
      /** The account this browser's cart belongs to; null = a guest's cart */
      ownerId: null,

      /** On login: the account's saved cart plus anything added as a guest (a guest's items are never dropped) */
      loadCart: async (userId) => {
          const savedItems = await fetchCartFromDB(userId);
          const { cartItems, ownerId } = get();
          const isOtherAccount = ownerId !== null && ownerId !== userId && ownerId !== UNKNOWN_OWNER;
          if (savedItems === null) {
              // Couldn't reach the server: keep what is in the browser (unless it is another account's cart)
              set(isOtherAccount ? { cartItems: [], ownerId: userId } : { ownerId: userId });
              return;
          }
          const dbItems = savedItems.map(normalizeCartItem);
          if (ownerId !== null) {
              // This browser's cart already belongs to an account. For that same account (or an old cart with no owner)
              // nothing changes: the saved cart wins, and the local one is kept only when nothing is saved.
              // Another account's cart is never shown to this one.
              const items = dbItems.length || isOtherAccount ? assignCartLineIds(dbItems) : cartItems;
              set({ cartItems: items, ownerId: userId });
              return;
          }
          if (cartItems.length === 0) {
              set({ cartItems: assignCartLineIds(dbItems), ownerId: userId });
              return;
          }
          // A guest's cart: add it to the account's cart and save the result
          let merged = mergeGuestCart(dbItems, cartItems);
          if (dbItems.some(isPhotoPrint) && cartItems.some(isPhotoPrint)) {
              merged = await repricePhotos(merged);
          }
          set({ cartItems: merged, ownerId: userId });
          await saveCartToDB(userId, merged);
      },

      /** Clears the cart from this browser (on logout); the account's cart stays saved on the server */
      resetCartLocal: () => {
          set({ cartItems: [], ownerId: null });
      },

      /** Not logged in on load: keep a guest's cart, but drop a cart left by an account whose session ended */
      dropOtherAccountCart: () => {
          if (get().ownerId) set({ cartItems: [], ownerId: null });
      },

      /** Adds items to the cart and shows the customer a confirmation. The confirmation text can be replaced with successMessage */
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

      /** Updates the price of items already in the cart (e.g. the photo price tier after more were added). getPrice returning undefined = no change */
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

      /** Removes every cart line the predicate matches (e.g. all photo prints at once) */
      removeItemsWhere: (predicate) => {
          set((state) => {
              const updatedCart = state.cartItems.filter((item) => !predicate(item));
              if (updatedCart.length === state.cartItems.length) return state;
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
      version: 1,
      migrate: (persisted, version) => (version < 1 ? { ...persisted, ownerId: UNKNOWN_OWNER } : persisted),
      partialize: (state) => ({
        cartItems: assignCartLineIds(state.cartItems).map((item) => compactCartItem(item)),
        ownerId: state.ownerId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.cartItems?.length) {
          state.cartItems = assignCartLineIds(state.cartItems);
        }
      },
    }
  )
);
