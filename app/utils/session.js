import { supabaseService } from '../services/supabaseService';
import { useUserStore } from '../store/userStore';
import { useProfileStore } from '../store/profileStore';

export const signOutEverywhere = async () => {
  try {
    await supabaseService.auth.signOut();
  } finally {
    useProfileStore.getState().clearProfile();
    useUserStore.getState().logout();
  }
};
