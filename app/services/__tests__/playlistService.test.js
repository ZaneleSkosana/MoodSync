jest.mock('../supabaseService', () => ({
  supabaseService: {
    tracks: {
      addTrack: jest.fn(),
    },
  },
}));

import { playlistService } from '../playlistService';
import { supabaseService } from '../supabaseService';

function mockAudiusResponse(data) {
  return {
    ok: true,
    json: async () => ({ data }),
  };
}

const oneTrack = {
  id: 'abc12',
  title: 'Song',
  user: { name: 'Artist' },
  genre: 'Electronic',
  duration: 200,
  is_streamable: true,
  is_stream_gated: false,
  artwork: { '480x480': 'https://example.com/480x480.jpg' },
};

describe('playlistService.searchTracks', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('maps a successful Audius response into a full-length track with a stream URL', async () => {
    global.fetch.mockResolvedValue(mockAudiusResponse([oneTrack]));

    const result = await playlistService.searchTracks('test');

    expect(result.success).toBe(true);
    expect(result.data[0]).toMatchObject({
      id: 'abc12',
      source: 'audius',
      title: 'Song',
      artist: 'Artist',
      duration: 200,
      coverArt: 'https://example.com/480x480.jpg',
    });
    expect(result.data[0].trackUrl).toBe(
      'https://api.audius.co/v1/tracks/abc12/stream?app_name=MoodSync'
    );
  });

  test('drops tracks that cannot be streamed in full', async () => {
    global.fetch.mockResolvedValue(
      mockAudiusResponse([
        oneTrack,
        { ...oneTrack, id: 'gated', is_stream_gated: true },
        { ...oneTrack, id: 'nostream', is_streamable: false },
        { ...oneTrack, id: 'short', duration: 10 },
      ])
    );

    const result = await playlistService.searchTracks('test');
    expect(result.data).toHaveLength(1);
  });

  test('retries once on failure before giving up', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('fetch failed: TLS error'))
      .mockResolvedValueOnce(mockAudiusResponse([oneTrack]));

    const result = await playlistService.searchTracks('test');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
  });

  test('after the retry also fails, returns a graceful error instead of throwing', async () => {
    global.fetch.mockRejectedValue(new Error('fetch failed: TLS error'));

    const result = await playlistService.searchTracks('test');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/TLS/);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('a non-ok HTTP response is treated as a failure, not thrown uncaught', async () => {
    global.fetch.mockResolvedValue({ ok: false });

    const result = await playlistService.searchTracks('test');
    expect(result.success).toBe(false);
  });

  test('a multi-word query with few matches also searches each word and merges without duplicates', async () => {
    global.fetch
      .mockResolvedValueOnce(mockAudiusResponse([oneTrack]))
      .mockResolvedValueOnce(mockAudiusResponse([oneTrack, { ...oneTrack, id: 'two' }]))
      .mockResolvedValueOnce(mockAudiusResponse([{ ...oneTrack, id: 'three' }]));

    const result = await playlistService.searchTracks('calm piano');

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(result.data.map((track) => track.id)).toEqual(['abc12', 'two', 'three']);
  });
});

describe('playlistService.addTrackToPlaylist', () => {
  beforeEach(() => {
    supabaseService.tracks.addTrack.mockReset();
    supabaseService.tracks.addTrack.mockResolvedValue({ success: true, data: [{ id: 1 }] });
  });

  test('preserves the track\'s real source/id, distinct from this row\'s own id, so it can later be correctly favorited', async () => {
    await playlistService.addTrackToPlaylist('playlist-1', {
      id: 555,
      source: 'itunes',
      title: 'Song',
      artist: 'Artist',
      trackUrl: 'https://example.com/preview.m4a',
    });

    expect(supabaseService.tracks.addTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        track_source: 'itunes',
        original_track_id: '555',
      })
    );
  });

  test('defaults source to itunes when not provided, matching the rest of the app (single source today)', async () => {
    await playlistService.addTrackToPlaylist('playlist-1', { id: 9, title: 'Song', artist: 'Artist' });

    expect(supabaseService.tracks.addTrack).toHaveBeenCalledWith(
      expect.objectContaining({ track_source: 'itunes' })
    );
  });
});
