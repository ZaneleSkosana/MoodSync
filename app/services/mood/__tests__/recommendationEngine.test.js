import {
  rankTracks,
  scoreTrack,
  matchMyMoodTarget,
  buildImproveMyMoodStages,
  buildMoodSearchTerms,
  weatherSearchModifier,
} from '../recommendationEngine';

// Shaped exactly like playlistService.searchTracks()'s output - the real
// shape these functions receive in the running app.
function searchResultTrack(overrides = {}) {
  return {
    id: '1',
    source: 'itunes',
    title: 'Track',
    artist: 'Artist',
    album: '',
    genre: 'Pop',
    duration: 180,
    trackUrl: 'https://example.com/preview.m4a',
    coverArt: null,
    previewUrl: 'https://example.com/preview.m4a',
    ...overrides,
  };
}

describe('rankTracks', () => {
  test('happy + high arousal target ranks higher-energy tracks above lower-energy ones', () => {
    const tracks = [
      searchResultTrack({ id: 'lofi', genre: 'Lo-Fi' }),
      searchResultTrack({ id: 'metal', genre: 'Metal' }),
    ];
    const ranked = rankTracks(tracks, { valence: 0.4, arousal: 0.85 });
    expect(ranked[0].id).toBe('metal');
  });

  test('sad + low arousal target ranks lower-energy tracks above higher-energy ones', () => {
    const tracks = [
      searchResultTrack({ id: 'lofi', genre: 'Lo-Fi' }),
      searchResultTrack({ id: 'metal', genre: 'Metal' }),
    ];
    const ranked = rankTracks(tracks, { valence: -0.4, arousal: 0.1 });
    expect(ranked[0].id).toBe('lofi');
  });

  test('fills in energy/valence estimates for search-result-shaped tracks (regression: these used to be silently skipped)', () => {
    const [ranked] = rankTracks([searchResultTrack({ genre: 'Metal' })], { valence: 0, arousal: 0.5 });
    expect(ranked.energyEstimate).toBeCloseTo(0.9);
    expect(ranked.valenceEstimate).toBeCloseTo(-0.25);
  });

  test('a track with no genre tag is treated as neutral, never guessed', () => {
    const [ranked] = rankTracks([searchResultTrack({ genre: undefined })], { valence: 0.5, arousal: 0.5 });
    expect(ranked.energyEstimate).toBeUndefined();
    expect(ranked.valenceEstimate).toBeUndefined();
  });

  test('never overwrites an estimate a track already has', () => {
    const [ranked] = rankTracks(
      [searchResultTrack({ genre: 'Metal', energyEstimate: 0.11, valenceEstimate: 0.22 })],
      { valence: 0, arousal: 0.5 }
    );
    expect(ranked.energyEstimate).toBe(0.11);
    expect(ranked.valenceEstimate).toBe(0.22);
  });
});

describe('scoreTrack', () => {
  test('recently played tracks score lower on novelty', () => {
    const track = searchResultTrack({ id: '42', genre: 'Pop' });
    const target = { valence: 0.3, arousal: 0.5 };

    const fresh = scoreTrack(track, target, { recentlyPlayedIds: new Set() });
    const recent = scoreTrack(track, target, { recentlyPlayedIds: new Set(['itunes:42']) });

    expect(recent.breakdown.novelty).toBeLessThan(fresh.breakdown.novelty);
    expect(recent.finalScore).toBeLessThan(fresh.finalScore);
  });

  test('genre and artist preferences pull the preference score away from neutral', () => {
    const track = searchResultTrack({ genre: 'Jazz', artist: 'Miles' });
    const target = { valence: 0, arousal: 0.5 };

    const neutral = scoreTrack(track, target, {});
    const preferred = scoreTrack(track, target, {
      genrePreferences: { jazz: 0.9 },
      artistPreferences: { miles: 0.9 },
    });

    expect(preferred.breakdown.preference).toBeGreaterThan(neutral.breakdown.preference);
  });
});

describe('Match My Mood / Improve My Mood', () => {
  test('matchMyMoodTarget targets the detected state exactly', () => {
    const target = matchMyMoodTarget({ valence: -0.4, arousal: 0.2 });
    expect(target).toEqual({ valence: -0.4, arousal: 0.2 });
  });

  test('Improve My Mood produces a gradual transition, not an immediate jump', () => {
    const sadState = { valence: -0.7, arousal: 0.15 };
    const stages = buildImproveMyMoodStages(sadState);

    expect(stages).toHaveLength(3);
    // Each stage should move strictly further from the starting point than
    // the last, both in valence and arousal - a monotonic climb, not a jump.
    for (let i = 1; i < stages.length; i += 1) {
      expect(stages[i].valence).toBeGreaterThan(stages[i - 1].valence);
      expect(stages[i].arousal).toBeGreaterThan(stages[i - 1].arousal);
    }
    // The first stage should stay well short of the final positive/energetic
    // anchor - no jumping straight to high-energy party music.
    expect(stages[0].valence).toBeLessThan(0.2);
  });
});

describe('buildMoodSearchTerms', () => {
  test('returns at least one term for every primary mood', () => {
    const moods = ['happy', 'sad', 'calm', 'excited', 'angry', 'anxious', 'neutral'];
    moods.forEach((primaryMood) => {
      const terms = buildMoodSearchTerms({ primaryMood, arousal: 0.5 });
      expect(terms.length).toBeGreaterThan(0);
    });
  });
});

describe('weatherSearchModifier', () => {
  test('never touches scoring - only ever returns extra search terms', () => {
    expect(weatherSearchModifier(null)).toEqual([]);
    expect(weatherSearchModifier({ available: false })).toEqual([]);
  });

  test('suggests rainy-day terms only when it is actually raining', () => {
    const terms = weatherSearchModifier({ available: true, condition: 'rain', isRaining: true, isDaytime: true });
    expect(terms).toContain('rainy day acoustic');
  });

  test('suggests sunny terms for clear daytime weather', () => {
    const terms = weatherSearchModifier({ available: true, condition: 'clear', isRaining: false, isDaytime: true });
    expect(terms).toContain('sunny day feel good');
  });
});
