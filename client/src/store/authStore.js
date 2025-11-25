import { create } from 'zustand';

const useAuthStore = create((set) => ({
    userId: null,
    role: null,
    isAuthenticated: null,

    login: (user) => {
        if (user && user._id && user.role) {
            set({
                userId: user._id,
                role: user.role,
                isAuthenticated: true
            });
        }
    },

    logout: async () => {
        try {
            await signOut();
        } catch (error) {
            console.error("Logout failed on server:", error);
        }
        set({ userId: null, role: null, isAuthenticated: false });
    },

    initialize: async () => {
        try {
            const response = await fetchUserInfo();
            const user = response.data;
            if (user && user._id && user.role) {
                set({
                    userId: user._id,
                    role: user.role,
                    isAuthenticated: true
                });
            } else {
                set({ isAuthenticated: false });
            }
        } catch (error) {
            set({ userId: null, role: null, isAuthenticated: false });
        }
    },

    isAdmin: () => {
        return useAuthStore.getState().role === 'admin';
    },
}));

useAuthStore.getState().initialize();

export default useAuthStore;