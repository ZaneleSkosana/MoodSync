import { create } from 'zustand';

export const usePlaylistStore = create((set) => ({
  playlists: [],
  currentPlaylist: null,
  favorites: [],
  isLoading: false,

  setPlaylists: (playlists) => set({ playlists }),

  setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),

  addPlaylist: (playlist) =>
    set((state) => ({
      playlists: [...state.playlists, playlist],
    })),

  updatePlaylist: (id, updates) =>
    set((state) => ({
      playlists: state.playlists.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  deletePlaylist: (id) =>
    set((state) => ({
      playlists: state.playlists.filter((p) => p.id !== id),
    })),

  addToFavorites: (track) =>
    set((state) => ({
      favorites: [...state.favorites, track],
    })),

  removeFromFavorites: (trackId) =>
    set((state) => ({
      favorites: state.favorites.filter((t) => t.id !== trackId),
    })),

  isFavorite: (trackId) => {
    const state = usePlaylistStore.getState();
    return state.favorites.some((t) => t.id === trackId);
  },

  setLoading: (isLoading) => set({ isLoading }),

  clearCurrentPlaylist: () => set({ currentPlaylist: null }),

  getPlaylistById: (id) => {
    const state = usePlaylistStore.getState();
    return state.playlists.find((p) => p.id === id);
  },
}));
