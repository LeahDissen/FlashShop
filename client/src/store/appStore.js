import { create } from 'zustand';

const useAppStore = create((set) => ({
    termsAgreed: false,
    setTermsAgreed: (isAgreed) => set({ termsAgreed: isAgreed }),

    isClubOpen: false,
    setClubOpen: (isOpen) => set({ isClubOpen: isOpen }),

    isTermsOpen: false,
    setTermsOpen: (isOpen) => set({ isTermsOpen: isOpen }),
}));

export default useAppStore;