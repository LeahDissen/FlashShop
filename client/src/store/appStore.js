import { create } from 'zustand';

const useAppStore = create((set) => ({
    termsAgreed: false,
    setTermsAgreed: (isAgreed) => set({ termsAgreed: isAgreed }),

    isClubOpen: false,
    setClubOpen: (isOpen) => set({ isClubOpen: isOpen }),

    isTermsOpen: false,
    setTermsOpen: (isOpen) => set({ isTermsOpen: isOpen }),

    /** Top menu names the admin edits with the logo (header page); empty = the default name */
    navLabels: {},
    setNavLabels: (navLabels) => set({ navLabels: navLabels || {} }),
}));

export default useAppStore;