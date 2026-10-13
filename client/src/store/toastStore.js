import { create } from 'zustand';

const DEFAULT_DURATION_MS = 2500;
let hideTimer = null;

/** הודעה קצרה וחולפת בתחתית המסך (למשל "המוצר נוסף לסל בהצלחה!") */
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
