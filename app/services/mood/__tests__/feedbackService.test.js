jest.mock('../../supabaseService', () => ({
  supabaseService: {
    feedback: {
      addFeedback: jest.fn(),
      getFeedbackByUser: jest.fn(),
      getFavorites: jest.fn(),
      removeFeedback: jest.fn(),
    },
  },
}));

import { supabaseService } from '../../supabaseService';
import {
  recordFeedback,
  buildPreferenceMaps,
  loadRecommendationContext,
  isFavorite,
  toggleFavorite,
  getFavoriteKeySet,
  feedbackRowToTrack,
} from '../feedbackService';

const track = {
  id: 123,
  source: 'itunes',
  title: 'Song',
  artist: 'Artist',
  genre: 'Pop',
  trackUrl: 'https://example.com/preview.m4a',
  coverArt: 'https://example.com/art.jpg',
  duration: 200,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('recordFeedback', () => {
  test('stores the playable fields alongside the preference-scoring fields', async () => {
    supabaseService.feedback.addFeedback.mockResolvedValue({ success: true });

    await recordFeedback('user-1', track, 'favorite');

    expect(supabaseService.feedback.addFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        track_source: 'itunes',
        track_id: '123',
        track_url: track.trackUrl,
        cover_art: track.coverArt,
        duration: 200,
        feedback_type: 'favorite',
      })
    );
  });

  test('rejects cleanly when user or track is missing, rather than calling Supabase', async () => {
    const result = await recordFeedback(null, track, 'like');
    expect(result.success).toBe(false);
    expect(supabaseService.feedback.addFeedback).not.toHaveBeenCalled();
  });
});

describe('buildPreferenceMaps', () => {
  test('a single skip nudges a genre down a little, not to zero (spec: gradual updates)', () => {
    const { genrePreferences } = buildPreferenceMaps([
      { track_genre: 'Metal', feedback_type: 'skip' },
    ]);
    expect(genrePreferences.metal).toBeLessThan(0.5);
    expect(genrePreferences.metal).toBeGreaterThan(0.3);
  });

  test('repeated likes for an artist push preference up over multiple entries', () => {
    const { artistPreferences } = buildPreferenceMaps([
      { track_artist: 'Miles', feedback_type: 'like' },
      { track_artist: 'Miles', feedback_type: 'like' },
      { track_artist: 'Miles', feedback_type: 'favorite' },
    ]);
    expect(artistPreferences.miles).toBeGreaterThan(0.5);
  });

  test('unscored feedback types (e.g. "played") are ignored rather than crashing', () => {
    const { genrePreferences } = buildPreferenceMaps([
      { track_genre: 'Jazz', feedback_type: 'played' },
    ]);
    expect(genrePreferences.jazz).toBeUndefined();
  });
});

describe('loadRecommendationContext', () => {
  test('no user id returns empty context without calling Supabase', async () => {
    const context = await loadRecommendationContext(null);
    expect(context.recentlyPlayedIds.size).toBe(0);
    expect(supabaseService.feedback.getFeedbackByUser).not.toHaveBeenCalled();
  });

  test('builds recentlyPlayedIds from skip/played_repeatedly, keyed by source:id', async () => {
    supabaseService.feedback.getFeedbackByUser.mockResolvedValue({
      success: true,
      data: [
        { track_source: 'itunes', track_id: '1', feedback_type: 'skip' },
        { track_source: 'itunes', track_id: '2', feedback_type: 'favorite' },
      ],
    });

    const context = await loadRecommendationContext('user-1');
    expect(context.recentlyPlayedIds.has('itunes:1')).toBe(true);
    expect(context.recentlyPlayedIds.has('itunes:2')).toBe(false);
  });
});

describe('isFavorite / toggleFavorite / getFavoriteKeySet', () => {
  test('isFavorite matches on source+id together, not id alone', async () => {
    supabaseService.feedback.getFavorites.mockResolvedValue({
      success: true,
      data: [{ track_source: 'itunes', track_id: '123' }],
    });

    expect(await isFavorite('user-1', track)).toBe(true);
    expect(await isFavorite('user-1', { ...track, source: 'deezer' })).toBe(false);
  });

  test('toggleFavorite removes when currently favorited, records when not', async () => {
    supabaseService.feedback.removeFeedback.mockResolvedValue({ success: true });
    await toggleFavorite('user-1', track, true);
    expect(supabaseService.feedback.removeFeedback).toHaveBeenCalledWith('user-1', 'itunes', '123', 'favorite');

    supabaseService.feedback.addFeedback.mockResolvedValue({ success: true });
    await toggleFavorite('user-1', track, false);
    expect(supabaseService.feedback.addFeedback).toHaveBeenCalled();
  });

  test('getFavoriteKeySet builds a source:id Set for O(1) membership checks', async () => {
    supabaseService.feedback.getFavorites.mockResolvedValue({
      success: true,
      data: [
        { track_source: 'itunes', track_id: '1' },
        { track_source: 'itunes', track_id: '2' },
      ],
    });

    const keys = await getFavoriteKeySet('user-1');
    expect(keys.has('itunes:1')).toBe(true);
    expect(keys.has('itunes:3')).toBe(false);
  });

  test('getFavoriteKeySet returns an empty Set rather than throwing when the fetch fails', async () => {
    supabaseService.feedback.getFavorites.mockResolvedValue({ success: false });
    const keys = await getFavoriteKeySet('user-1');
    expect(keys.size).toBe(0);
  });
});

describe('feedbackRowToTrack', () => {
  test('round-trips a stored feedback row back into a playable track shape', () => {
    const row = {
      track_source: 'itunes',
      track_id: '123',
      track_title: 'Song',
      track_artist: 'Artist',
      track_genre: 'Pop',
      track_url: 'https://example.com/preview.m4a',
      cover_art: 'https://example.com/art.jpg',
      duration: 200,
    };

    const result = feedbackRowToTrack(row);
    expect(result).toMatchObject({
      id: '123',
      source: 'itunes',
      title: 'Song',
      artist: 'Artist',
      trackUrl: row.track_url,
      coverArt: row.cover_art,
      duration: 200,
    });
  });

  test('a row saved before the playback-fields migration (all null) still produces a displayable, non-throwing track', () => {
    const row = {
      track_source: 'itunes',
      track_id: '9',
      track_title: 'Old Favorite',
      track_artist: 'Someone',
      track_genre: null,
      track_url: null,
      cover_art: null,
      duration: null,
    };

    const result = feedbackRowToTrack(row);
    expect(result.trackUrl).toBeNull();
    expect(result.duration).toBe(0);
    expect(result.title).toBe('Old Favorite');
  });
});
