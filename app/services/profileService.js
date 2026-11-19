import { supabaseService, supabase } from './supabaseService';

export const profileService = {
  ensureProfile: async (user, fullName) => {
    try {
      if (!user?.id) {
        return { success: false, error: 'No user' };
      }

      const existing = await supabaseService.users.getProfile(user.id);
      if (existing.success && existing.data) {
        return existing;
      }

      const created = await supabaseService.users.createProfile(user.id, {
        email: user.email,
        full_name: fullName || user.user_metadata?.full_name || '',
      });

      if (!created.success) {
        console.log('PROFILE CREATE FAILED:', created.error);
      }
      return created;
    } catch (error) {
      console.log('PROFILE ENSURE ERROR:', error);
      return { success: false, error: error.message };
    }
  },

  getMyProfile: async (userId) => {
    try {
      if (!userId) {
        return { success: false, error: 'No user' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return { success: true, data: data || null };
    } catch (error) {
      return { success: false, error: error.message || String(error) };
    }
  },
};
