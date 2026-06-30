import { create } from 'zustand';

export const useProductStore = create((set) => ({
    selectedProduct: null,
    orderQuantity: 1,
    setSelectedProduct: (product) => set({ selectedProduct: product }),
    setOrderQuantity: (orderQuantity) => set({ orderQuantity: Math.max(1, orderQuantity) }),
}));
