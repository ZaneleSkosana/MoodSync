const AUDIUS_API = 'https://api.audius.co/v1';
const AUDIUS_APP_NAME = 'MoodSync';
const REQUEST_TIMEOUT_MS = 8000;
const RESULT_LIMIT = 25;
const MIN_RESULTS_BEFORE_FALLBACK = 12;
const MIN_DURATION_SECONDS = 60;
const MAX_DURATION_SECONDS = 900;

const STOP_WORDS = new Set([
  'and', 'the', 'for', 'with', 'music', 'songs', 'song', 'mix', 'playlist',
]);

const getStreamUrl = (trackId) =>
  `${AUDIUS_API}/tracks/${encodeURIComponent(trackId)}/stream?app_name=${AUDIUS_APP_NAME}`;

const isPlayable = (item) => {
  if (!item || !item.id) return false;
  if (item.is_streamable === false) return false;
  if (item.is_stream_gated) return false;
  if (item.is_unlisted || item.is_delete) return false;
  const duration = Number(item.duration || 0);
  return duration >= MIN_DURATION_SECONDS && duration <= MAX_DURATION_SECONDS;
};

const toTrack = (item) => ({
  id: String(item.id),
  source: 'audius',
  title: item.title || 'Unknown Track',
  artist: item.user?.name || 'Unknown Artist',
  album: '',
  genre: item.genre || undefined,
  duration: Math.floor(Number(item.duration || 0)),
  trackUrl: getStreamUrl(item.id),
  coverArt:
    item.artwork?.['480x480'] ||
    item.artwork?.['150x150'] ||
    item.artwork?.['1000x1000'] ||
    null,
});

const searchAudius = async (query, limit) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url =
      `${AUDIUS_API}/tracks/search?query=${encodeURIComponent(query)}` +
      `&limit=${limit}&app_name=${AUDIUS_APP_NAME}`;

    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error('Music search failed');
    }

    const body = await response.json();
    const items = Array.isArray(body?.data) ? body.data : [];

    return items.filter(isPlayable).map(toTrack);
  } finally {
    clearTimeout(timeout);
  }
};

const mergeUnique = (lists) => {
  const seen = new Set();
  const merged = [];

  lists.forEach((list) => {
    list.forEach((track) => {
      if (!seen.has(track.id)) {
        seen.add(track.id);
        merged.push(track);
      }
    });
  });

  return merged;
};

export const musicService = {
  getStreamUrl,

  searchTracks: async (query, attempt = 1) => {
    try {
      const cleanQuery = String(query || '').trim();

      if (!cleanQuery) {
        return { success: true, data: [] };
      }

      let tracks = await searchAudius(cleanQuery, RESULT_LIMIT);

      if (tracks.length < MIN_RESULTS_BEFORE_FALLBACK) {
        const words = Array.from(
          new Set(
            cleanQuery
              .toLowerCase()
              .split(/\s+/)
              .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
          )
        ).slice(0, 4);

        if (words.length > 1) {
          const perWord = await Promise.all(
            words.map((word) => searchAudius(word, 15).catch(() => []))
          );
          tracks = mergeUnique([tracks, ...perWord]);
        }
      }

      return { success: true, data: tracks.slice(0, RESULT_LIMIT) };
    } catch (error) {
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return musicService.searchTracks(query, attempt + 1);
      }

      console.error('Music search error:', error);

      return { success: false, error: error.message };
    }
  },
};
