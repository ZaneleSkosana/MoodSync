import { playlistService } from '../playlistService';

function mockItunesResponse(results) {
  return {
    ok: true,
    json: async () => ({ results }),
  };
}

const oneTrack = {
  trackId: 111,
  trackName: 'Song',
  artistName: 'Artist',
  collectionName: 'Album',
  primaryGenreName: 'Pop',
  trackTimeMillis: 200000,
  artworkUrl100: 'https://example.com/100x100.jpg',
  previewUrl: 'https://example.com/preview.m4a',
};

describe('playlistService.searchTracks', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('maps a successful iTunes response into the expected track shape', async () => {
    global.fetch.mockResolvedValue(mockItunesResponse([oneTrack]));

    const result = await playlistService.searchTracks('test');

    expect(result.success).toBe(true);
    expect(result.data[0]).toMatchObject({ id: 111, source: 'itunes', title: 'Song', trackUrl: oneTrack.previewUrl });
  });

  test('drops tracks with no preview URL rather than passing an unplayable track through', async () => {
    global.fetch.mockResolvedValue(mockItunesResponse([oneTrack, { ...oneTrack, trackId: 222, previewUrl: null }]));

    const result = await playlistService.searchTracks('test');
    expect(result.data).toHaveLength(1);
  });

  test('retries once on failure before giving up (transient network/TLS blips)', async () => {
    global.fetch
      .mockRejectedValueOnce(new Error('fetch failed: TLS error'))
      .mockResolvedValueOnce(mockItunesResponse([oneTrack]));

    const result = await playlistService.searchTracks('test');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
  });

  test('after the retry also fails, returns a graceful error instead of throwing', async () => {
    global.fetch.mockRejectedValue(new Error('fetch failed: TLS error'));

    const result = await playlistService.searchTracks('test');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/TLS/);
    expect(global.fetch).toHaveBeenCalledTimes(2); // one try + one retry, not infinite
  });

  test('a non-ok HTTP response is treated as a failure, not thrown uncaught', async () => {
    global.fetch.mockResolvedValue({ ok: false });

    const result = await playlistService.searchTracks('test');
    expect(result.success).toBe(false);
  });
});
