/**
 * Real feedback persistence + preference scoring, replacing the previous
 * mocked implementations in playlistService.js
 * (toggleFavoriteTrack/getFavoriteTracks returned canned/fake data, and
 * SearchScreen's handleFavorite was a console.log with no persistence at
 * all).
 *
 * Track identity is source-aware ({source, id}) throughout - see
 * moodTypes.js's TrackFeatures typedef. iTunes is the only source that
 * actually works today (see recommendationEngine.js's header comment), but
 * keeping the shape source-aware now avoids a painful migration if a second
 * source (Deezer, Spotify search, etc.) is ever wired in for real.
 *
 * Preference updates are intentionally gradual (spec section 17): one skip
 * nudges a genre/artist score down a little, it doesn't zero it out.
 */

import { supabaseService } from '../supabaseService';

/** How much a single piece of feedback moves a preference score, per type. */
const FEEDBACK_DELTA = {
  favorite: 0.12,
  like: 0.08,
  played_repeatedly: 0.06,
  skip: -0.1,
  dislike: -0.15,
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/**
 * @param {string} userId
 * @param {import('./moodTypes').TrackFeatures} track
 * @param {'favorite'|'like'|'dislike'|'skip'|'played_repeatedly'} feedbackType
 */
export async function recordFeedback(userId, track, feedbackType) {
  if (!userId || !track) {
    return { success: false, error: 'Missing user or track' };
  }

  try {
    const result = await supabaseService.feedback.addFeedback({
      user_id: userId,
      track_source: track.source || 'itunes',
      track_id: String(track.id),
      track_title: track.title || null,
      track_artist: track.artist || null,
      track_genre: track.genre || null,
      track_url: track.trackUrl || null,
      cover_art: track.coverArt || null,
      duration: track.duration || null,
      feedback_type: feedbackType,
      created_at: new Date().toISOString(),
    });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Converts a stored feedback row back into the track shape TrackCard and
 * playerStore.play() expect. Requires the migration adding
 * track_url/cover_art/duration to `feedback` - rows saved before that
 * migration will have those fields null, so playback won't work for them
 * (they can still be displayed by title/artist).
 *
 * @param {Object} row a row from supabaseService.feedback.getFavorites/getFeedbackByUser
 */
export function feedbackRowToTrack(row) {
  return {
    id: row.track_id,
    source: row.track_source || 'itunes',
    title: row.track_title,
    artist: row.track_artist,
    genre: row.track_genre || undefined,
    duration: row.duration || 0,
    trackUrl: row.track_url || null,
    coverArt: row.cover_art || null,
    previewUrl: row.track_url || null,
  };
}

/**
 * Builds genre/artist preference maps (0..1, default 0.5 = neutral) from a
 * user's feedback history, for use as `context` in
 * recommendationEngine.scoreTrack/rankTracks.
 *
 * @param {Array<{track_genre?:string, track_artist?:string, feedback_type:string}>} feedbackHistory
 */
export function buildPreferenceMaps(feedbackHistory = []) {
  const genrePreferences = {};
  const artistPreferences = {};

  const applyDelta = (map, key, delta) => {
    if (!key) return;
    const normalizedKey = key.toLowerCase().trim();
    const current = map[normalizedKey] ?? 0.5;
    map[normalizedKey] = clamp01(current + delta);
  };

  // Oldest first, so the most recent feedback has the last (largest
  // cumulative) influence without any single interaction dominating.
  const chronological = [...feedbackHistory].reverse();

  for (const entry of chronological) {
    const delta = FEEDBACK_DELTA[entry.feedback_type] || 0;
    if (!delta) continue;
    applyDelta(genrePreferences, entry.track_genre, delta);
    applyDelta(artistPreferences, entry.track_artist, delta);
  }

  return { genrePreferences, artistPreferences };
}

/**
 * @param {string} userId
 * @returns {Promise<{ genrePreferences: Record<string, number>, artistPreferences: Record<string, number>, recentlyPlayedIds: Set<string> }>}
 */
export async function loadRecommendationContext(userId) {
  if (!userId) {
    return { genrePreferences: {}, artistPreferences: {}, recentlyPlayedIds: new Set() };
  }

  const result = await supabaseService.feedback.getFeedbackByUser(userId, 200);
  const history = result.success ? result.data || [] : [];
  const { genrePreferences, artistPreferences } = buildPreferenceMaps(history);

  const recentlyPlayedIds = new Set(
    history
      .filter((entry) => entry.feedback_type === 'played_repeatedly' || entry.feedback_type === 'skip')
      .slice(0, 30)
      .map((entry) => `${entry.track_source}:${entry.track_id}`)
  );

  return { genrePreferences, artistPreferences, recentlyPlayedIds };
}

export async function isFavorite(userId, track) {
  if (!userId || !track) return false;
  const result = await supabaseService.feedback.getFavorites(userId);
  if (!result.success) return false;
  return (result.data || []).some(
    (entry) => entry.track_source === (track.source || 'itunes') && entry.track_id === String(track.id)
  );
}

/**
 * Fetches all of a user's favorited tracks as a Set of "source:id" keys, for
 * O(1) membership checks against a whole list (e.g. search results) instead
 * of one getFavorites() round-trip per track.
 * @returns {Promise<Set<string>>}
 */
export async function getFavoriteKeySet(userId) {
  if (!userId) return new Set();
  const result = await supabaseService.feedback.getFavorites(userId);
  if (!result.success) return new Set();
  return new Set((result.data || []).map((entry) => `${entry.track_source}:${entry.track_id}`));
}

export async function toggleFavorite(userId, track, currentlyFavorite) {
  if (currentlyFavorite) {
    return supabaseService.feedback.removeFeedback(
      userId,
      track.source || 'itunes',
      String(track.id),
      'favorite'
    );
  }
  return recordFeedback(userId, track, 'favorite');
}
