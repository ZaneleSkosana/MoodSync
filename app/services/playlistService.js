import { supabaseService } from './supabaseService';
import { generatePlaylistName } from '../utils/helpers';
import { musicService } from './musicService';

export const playlistService = {
  createPlaylist: async (userId, playlistData) => {
    try {
      const playlist = {
        user_id: userId,
        name: playlistData.name || generatePlaylistName(
          playlistData.mood,
          playlistData.environment
        ),
        description: playlistData.description || '',
        mood: playlistData.mood || null,
        environment: playlistData.environment || null,
        is_public: playlistData.isPublic || false,
        cover_image: playlistData.coverImage || null,
        created_at: new Date().toISOString(),
      };

      const result = await supabaseService.playlists.createPlaylist(playlist);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  getUserPlaylists: async (userId) => {
    try {
      const result = await supabaseService.playlists.getPlaylistsByUser(userId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  getPlaylistById: async (playlistId) => {
    try {
      const result = await supabaseService.playlists.getPlaylistById(playlistId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  updatePlaylist: async (playlistId, updates) => {
    try {
      const result = await supabaseService.playlists.updatePlaylist(
        playlistId,
        updates
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  deletePlaylist: async (playlistId) => {
    try {
      const result = await supabaseService.playlists.deletePlaylist(playlistId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  addTrackToPlaylist: async (playlistId, trackData) => {
    try {
      const track = {
        playlist_id: playlistId,
        title: trackData.title,
        artist: trackData.artist,
        album: trackData.album || null,
        duration: trackData.duration || 0,
        track_url: trackData.trackUrl || null,
        cover_art: trackData.coverArt || null,
        position: trackData.position || 0,
        added_at: new Date().toISOString(),
        track_source: trackData.source || 'itunes',
        original_track_id: trackData.id != null ? String(trackData.id) : null,
      };

      const result = await supabaseService.tracks.addTrack(track);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  getPlaylistTracks: async (playlistId) => {
    try {
      const result = await supabaseService.tracks.getTracksByPlaylist(
        playlistId
      );
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  removeTrackFromPlaylist: async (trackId) => {
    try {
      const result = await supabaseService.tracks.deleteTrack(trackId);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  reorderTracks: async (playlistId, trackIds) => {
    try {
      const updates = trackIds.map((id, index) =>
        supabaseService.tracks.updateTrack(id, {
          position: index,
        })
      );

      await Promise.all(updates);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  searchTracks: (query) => musicService.searchTracks(query),

  getPublicPlaylists: async (limit = 20) => {
    try {
      const mockPublicPlaylists = [
        {
          id: 201,
          name: 'Chill Vibes',
          user_id: 'user1',
          is_public: true,
          mood: 'Calm',
        },
        {
          id: 202,
          name: 'Workout Energy',
          user_id: 'user2',
          is_public: true,
          mood: 'Energetic',
        },
        {
          id: 203,
          name: 'Focus Flow',
          user_id: 'user3',
          is_public: true,
          mood: 'Motivated',
        },
      ];

      return {
        success: true,
        data: mockPublicPlaylists.slice(0, limit),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  getPlaylistStats: async (playlistId) => {
    try {
      const tracksResult =
        await supabaseService.tracks.getTracksByPlaylist(playlistId);

      if (!tracksResult.success) {
        return tracksResult;
      }

      const totalTracks = tracksResult.data.length;

      const totalDuration = tracksResult.data.reduce(
        (sum, track) => sum + (track.duration || 0),
        0
      );

      return {
        success: true,
        data: {
          totalTracks,
          totalDuration,
          totalDurationFormatted: `${Math.floor(totalDuration / 60)} min`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

};