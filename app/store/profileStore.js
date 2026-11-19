import { create } from 'zustand';
import { profileService } from '../services/profileService';

export const useProfileStore = create((set, get) => ({
  profile: null,
  loaded: false,
  busy: false,
  continueAsUser: false,
  reapply: false,

  setBusy: (busy) => set({ busy }),
  setContinueAsUser: (continueAsUser) => set({ continueAsUser }),
  setReapply: (reapply) => set({ reapply }),

  loadProfile: async (userId) => {
    if (!userId) {
      set({ profile: null, loaded: false });
      return null;
    }

    const result = await profileService.getMyProfile(userId);

    if (result.success) {
      set({ profile: result.data, loaded: true });
      return result.data;
    }

    set({ loaded: true });
    return get().profile;
  },

  clearProfile: () =>
    set({
      profile: null,
      loaded: false,
      busy: false,
      continueAsUser: false,
      reapply: false,
    }),
}));
