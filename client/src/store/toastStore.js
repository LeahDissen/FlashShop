import { create } from 'zustand';

const DEFAULT_DURATION_MS = 2500;
let hideTimer = null;

/** A short, transient message at the bottom of the screen (e.g. the "added to cart" confirmation) */
const useToastStore = create((set) => ({
    toast: null,

    showToast: (message, { durationMs = DEFAULT_DURATION_MS } = {}) => {
        clearTimeout(hideTimer);
        set({ toast: { message, id: Date.now() } });
        hideTimer = setTimeout(() => set({ toast: null }), durationMs);
    },

    hideToast: () => {
        clearTimeout(hideTimer);
        set({ toast: null });
    },
}));

export default useToastStore;
