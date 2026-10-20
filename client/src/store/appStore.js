import { create } from 'zustand';

const useAppStore = create((set) => ({
    termsAgreed: false,
    setTermsAgreed: (isAgreed) => set({ termsAgreed: isAgreed }),

    isClubOpen: false,
    setClubOpen: (isOpen) => set({ isClubOpen: isOpen }),
    /** Opens the join popup with the email filled in (checkout, "הצטרף עכשיו" on a gift product) */
    clubPrefillEmail: '',
    openClubWithEmail: (email) => set({ isClubOpen: true, clubPrefillEmail: email || '' }),
    /** Changes after a successful join, so the checkout recalculates the member discounts */
    clubJoinedAt: 0,
    markClubJoined: () => set({ clubJoinedAt: Date.now() }),

    isTermsOpen: false,
    setTermsOpen: (isOpen) => set({ isTermsOpen: isOpen }),

    /** Top menu names the admin edits with the logo (header page); empty = the default name */
    navLabels: {},
    setNavLabels: (navLabels) => set({ navLabels: navLabels || {} }),
}));

export default useAppStore;