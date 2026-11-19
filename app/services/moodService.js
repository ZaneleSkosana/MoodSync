import { supabaseService } from './supabaseService';
import { getMoodEmoji } from '../utils/helpers';
import { PLAYLIST_MOODS, ENVIRONMENT_MUSIC } from '../utils/constants';

export const moodService = {
  saveMood: async (userId, moodData) => {
    try {
      const mood = {
        user_id: userId,
        mood_label: moodData.mood,
        mood_emoji: getMoodEmoji(moodData.mood),
        environment: moodData.environment || null,
        score: moodData.score || 5,
        notes: moodData.notes || null,
        created_at: new Date().toISOString(),
      };

      // Optional multimodal mood-engine fields (app/services/mood/). Only
      // set when the caller actually has them, so the existing manual
      // mood-selection flow (MoodSelectionScreen.js) keeps writing exactly
      // the columns it always has. Requires the nullable columns added by
      // supabase/migrations/20260912000000_add_mood_engine_fields.sql.
      if (typeof moodData.valence === 'number') mood.valence = moodData.valence;
      if (typeof moodData.arousal === 'number') mood.arousal = moodData.arousal;
      if (typeof moodData.confidence === 'number') mood.confidence = moodData.confidence;
      if (moodData.primaryMood) mood.primary_mood = moodData.primaryMood;
      if (moodData.qualityIssues) mood.quality_issues = moodData.qualityIssues;
      if (moodData.detectionMode) mood.detection_mode = moodData.detectionMode;

      const result = await supabaseService.moods.addMood(mood);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getUserMoodHistory: async (userId, limit = 30) => {
    try {
      const result = await supabaseService.moods.getMoodsByUser(userId, limit);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getMoodTrend: async (userId) => {
    try {
      const result = await supabaseService.moods.getMoodsByUser(userId, 14);
      if (result.success && result.data) {
        const trend = result.data.map(m => ({
          date: m.created_at,
          mood: m.mood_label,
          score: m.score,
        }));
        return { success: true, data: trend };
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getRecommendedPlaylist: (mood, environment) => {
    const genres = PLAYLIST_MOODS[mood] || ['Pop', 'Indie'];
    const envMusic = ENVIRONMENT_MUSIC[environment] || { genres: genres, vibe: 'Relaxed' };
    
    return {
      name: `${mood} - ${environment}`,
      genres: envMusic.genres,
      vibe: envMusic.vibe,
      description: `Music curated for ${mood.toLowerCase()} mood in ${environment.toLowerCase()} setting`,
    };
  },

  detectMoodFromExpression: async (faceData) => {
    try {
      const emotions = faceData.emotions || {};
      const maxEmotion = Object.keys(emotions).reduce((a, b) => 
        emotions[a] > emotions[b] ? a : b
      );
      
      const moodMapping = {
        happy: 'Happy',
        sad: 'Sad',
        angry: 'Stressed',
        neutral: 'Calm',
        surprised: 'Energetic',
      };
      
      return {
        success: true,
        mood: moodMapping[maxEmotion] || 'Calm',
        confidence: emotions[maxEmotion] || 0,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};
