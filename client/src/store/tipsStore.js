import { create } from "zustand";

export const useTipsStore = create((set) => ({
    currentTip: null,
    setCurrentTip: (tip) => set({ currentTip: tip }),

    tipsList: [],
    setTipsList: (list) => set({ tipsList: list }),

    updateTipInList: (updatedTip) =>
        set((state) => ({
            tipsList: state.tipsList.map((tip) =>
                tip._id === updatedTip._id ? updatedTip : tip
            )
        }))
}));
