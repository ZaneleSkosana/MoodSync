import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants';

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY (first 20 chars):', SUPABASE_ANON_KEY?.slice(0, 20));

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const supabaseService = {
  auth: {
    signUp: async (email, password, fullName) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    signIn: async (email, password) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    resetPassword: async (email) => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getCurrentUser: async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return { success: true, data: data?.user ?? null };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    // Fires on sign-in, sign-out, and token refresh - lets the navigator
    // stay correct even when auth state changes outside of a manual
    // signIn()/signOut() call (e.g. a refresh token expiring).
    onAuthStateChange: (callback) => {
      return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
    },
  },

  users: {
    createProfile: async (userId, profileData) => {
      try {
        const { data, error } = await supabase.from('profiles').insert([{ id: userId, ...profileData }]);
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getProfile: async (userId) => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    updateProfile: async (userId, updates) => {
      try {
        const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    deleteProfile: async (userId) => {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getAllUsers: async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },
  },

  moods: {
    addMood: async (mood) => {
      try {
        const { data, error } = await supabase.from('moods').insert([mood]).select();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getMoodsByUser: async (userId, limit = 100) => {
      try {
        const { data, error } = await supabase
          .from('moods')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getMoodById: async (id) => {
      try {
        const { data, error } = await supabase.from('moods').select('*').eq('id', id).single();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    updateMood: async (id, updates) => {
      try {
        const { data, error } = await supabase.from('moods').update(updates).eq('id', id).select();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    deleteMood: async (id) => {
      try {
        const { error } = await supabase.from('moods').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },
  },

  playlists: {
    createPlaylist: async (playlist) => {
      try {
        const { data, error } = await supabase.from('playlists').insert([playlist]).select();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getPlaylistsByUser: async (userId) => {
      try {
        const { data, error } = await supabase.from('playlists').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getPlaylistById: async (id) => {
      try {
        const { data, error } = await supabase.from('playlists').select('*').eq('id', id).single();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    updatePlaylist: async (id, updates) => {
      try {
        const { data, error } = await supabase.from('playlists').update(updates).eq('id', id).select();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    deletePlaylist: async (id) => {
      try {
        const { error } = await supabase.from('playlists').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },
  },

  tracks: {
    addTrack: async (track) => {
      try {
        const { data, error } = await supabase.from('tracks').insert([track]).select();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getTracksByPlaylist: async (playlistId) => {
      try {
        const { data, error } = await supabase.from('tracks').select('*').eq('playlist_id', playlistId).order('position', { ascending: true });
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    updateTrack: async (id, updates) => {
      try {
        const { data, error } = await supabase.from('tracks').update(updates).eq('id', id).select();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    deleteTrack: async (id) => {
      try {
        const { error } = await supabase.from('tracks').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },
  },

  subscriptions: {
    createSubscriptionRecord: async (record) => {
      try {
        const { data, error } = await supabase.from('subscriptions').insert([record]).select();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getSubscriptionByUser: async (userId) => {
      try {
        const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (error && error.code !== 'PGRST116') throw error;
        return { success: true, data: data || null };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    updateSubscription: async (id, updates) => {
      try {
        const { data, error } = await supabase.from('subscriptions').update(updates).eq('id', id).select();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    cancelSubscription: async (id) => {
      try {
        const { data, error } = await supabase.from('subscriptions').update({ is_active: false, cancelled_at: new Date().toISOString() }).eq('id', id).select();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },
  },

  feedback: {
    // Upsert, not insert: repeat feedback of the same (user, track, type)
    // just refreshes recency instead of throwing a duplicate-key error -
    // e.g. tapping "like" on the same track twice shouldn't crash.
    addFeedback: async (feedback) => {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .upsert([feedback], { onConflict: 'user_id,track_source,track_id,feedback_type' })
          .select();
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getFeedbackByUser: async (userId, limit = 200) => {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getFavorites: async (userId) => {
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .eq('user_id', userId)
          .eq('feedback_type', 'favorite')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    removeFeedback: async (userId, trackSource, trackId, feedbackType) => {
      try {
        const { error } = await supabase
          .from('feedback')
          .delete()
          .eq('user_id', userId)
          .eq('track_source', trackSource)
          .eq('track_id', trackId)
          .eq('feedback_type', feedbackType);
        if (error) throw error;
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },
  },

  admin: {
    getAllMoods: async (limit = 100) => {
      try {
        const { data, error } = await supabase.from('moods').select('*').order('created_at', { ascending: false }).limit(limit);
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    getAllPlaylists: async (limit = 100) => {
      try {
        const { data, error } = await supabase.from('playlists').select('*').order('created_at', { ascending: false }).limit(limit);
        if (error) throw error;
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message || error };
      }
    },

    // NOTE: admin.rawQuery(sql) used to live here - it passed an arbitrary
    // client-supplied SQL string straight into an `execute_sql` RPC call.
    // Nothing in the app ever called it, so it was pure attack surface: any
    // API consumer holding the public anon key could have executed
    // arbitrary SQL against this database. Removed rather than patched,
    // since there's no safe version of "run this raw SQL string from the
    // client." If an `execute_sql` Postgres function still exists on the
    // Supabase project, it should be dropped there too (this client-side
    // removal alone doesn't do that) - it's only reachable if that RPC
    // exists and is grantable to the anon/authenticated role.
  },
};

export { supabase };
