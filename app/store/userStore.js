import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  updateUserProfile: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  isAuthenticated: () => {
    const state = useUserStore.getState();
    return state.user !== null;
  },

  logout: () =>
    set({
      user: null,
      error: null,
    }),
}));
