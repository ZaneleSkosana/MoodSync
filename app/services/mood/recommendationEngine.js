
/**
 * Recommendation scoring layer on top of the existing iTunes Search
 * integration (app/services/playlistService.js).
 *
 * iTunes's Search API does not expose real audio features such as BPM,
 * energy, or valence. The energy/valence values below are coarse
 * genre-based estimates using the iTunes genre field.
 *
 * No React Native imports - pure logic, unit-testable with plain Node.
 */

import { RECOMMENDATION_WEIGHTS } from './moodTypes';

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

/**
 * Heuristic genre -> { energy, valence } lookup.
 */
export const GENRE_PROFILES = {
  pop: { energy: 0.6, valence: 0.35 },
  dance: { energy: 0.85, valence: 0.5 },
  'hip-hop/rap': { energy: 0.7, valence: 0.1 },
  'hip hop': { energy: 0.7, valence: 0.1 },
  rap: { energy: 0.7, valence: 0.05 },
  alternative: { energy: 0.55, valence: -0.1 },
  rock: { energy: 0.75, valence: 0.0 },
  electronic: { energy: 0.8, valence: 0.2 },
  dance_electronic: { energy: 0.8, valence: 0.2 },
  'r&b/soul': { energy: 0.45, valence: 0.2 },
  'r&b': { energy: 0.45, valence: 0.2 },
  soul: { energy: 0.4, valence: 0.25 },
  classical: { energy: 0.25, valence: 0.1 },
  jazz: { energy: 0.4, valence: 0.15 },
  ambient: { energy: 0.15, valence: 0.05 },
  'singer/songwriter': { energy: 0.35, valence: 0.0 },
  acoustic: { energy: 0.3, valence: -0.05 },
  country: { energy: 0.5, valence: 0.1 },
  blues: { energy: 0.35, valence: -0.3 },
  metal: { energy: 0.9, valence: -0.25 },
  latin: { energy: 0.75, valence: 0.4 },
  reggae: { energy: 0.5, valence: 0.35 },
  'k-pop': { energy: 0.75, valence: 0.4 },
  indie: { energy: 0.5, valence: 0.1 },
  'indie pop': { energy: 0.55, valence: 0.25 },
  folk: { energy: 0.3, valence: 0.05 },
  'lo-fi': { energy: 0.2, valence: 0.05 },
  chill: { energy: 0.2, valence: 0.1 },
};

/**
 * Convert a raw iTunes item into the app's TrackFeatures shape.
 */
export function toTrackFeatures(itunesItem) {
  if (!itunesItem || typeof itunesItem !== 'object') {
    return null;
  }

  const genreKey = String(
    itunesItem.primaryGenreName || ''
  )
    .toLowerCase()
    .trim();

  const profile = GENRE_PROFILES[genreKey];

  return {
    source: 'itunes',
    id: String(
      itunesItem.trackId ??
        itunesItem.id ??
        ''
    ),
    title:
      itunesItem.trackName ||
      itunesItem.title ||
      'Unknown Track',
    artist:
      itunesItem.artistName ||
      itunesItem.artist ||
      'Unknown Artist',
    album:
      itunesItem.collectionName ||
      itunesItem.album ||
      '',
    genre:
      itunesItem.primaryGenreName ||
      itunesItem.genre ||
      undefined,
    energyEstimate: profile
      ? profile.energy
      : undefined,
    valenceEstimate: profile
      ? profile.valence
      : undefined,
    duration: itunesItem.trackTimeMillis
      ? Math.floor(
          itunesItem.trackTimeMillis / 1000
        )
      : itunesItem.duration || 0,
    coverArt: itunesItem.artworkUrl100
      ? itunesItem.artworkUrl100.replace(
          '100x100',
          '300x300'
        )
      : itunesItem.coverArt || null,
    trackUrl:
      itunesItem.previewUrl ||
      itunesItem.trackUrl ||
      null,
  };
}

/**
 * Scores one track against a target valence/arousal.
 */
export function scoreTrack(
  track,
  target,
  context = {}
) {
  if (!track || !target) {
    return {
      finalScore: 0,
      breakdown: {
        moodCompatibility: 0.5,
        energyCompatibility: 0.5,
        preference: 0.5,
        novelty: 1,
      },
    };
  }

  const {
    genrePreferences = {},
    artistPreferences = {},
    recentlyPlayedIds = new Set(),
  } = context;

  const moodCompatibility =
    track.valenceEstimate == null
      ? 0.5
      : 1 -
        Math.abs(
          track.valenceEstimate -
            target.valence
        ) /
          2;

  const energyCompatibility =
    track.energyEstimate == null
      ? 0.5
      : 1 -
        Math.abs(
          track.energyEstimate -
            target.arousal
        );

  const genreKey = String(
    track.genre || ''
  )
    .toLowerCase()
    .trim();

  const genrePref =
    genrePreferences[genreKey];

  const artistKey = String(
    track.artist || ''
  )
    .toLowerCase()
    .trim();

  const artistPref =
    artistPreferences[artistKey];

  const preference =
    genrePref != null &&
    artistPref != null
      ? clamp(
          (genrePref + artistPref) / 2,
          0,
          1
        )
      : clamp(
          genrePref ??
            artistPref ??
            0.5,
          0,
          1
        );

  const trackKey = `${track.source}:${track.id}`;

  const novelty =
    recentlyPlayedIds &&
    typeof recentlyPlayedIds.has ===
      'function' &&
    recentlyPlayedIds.has(trackKey)
      ? 0.2
      : 1;

  const finalScore =
    RECOMMENDATION_WEIGHTS.mood *
      clamp(
        moodCompatibility,
        0,
        1
      ) +
    RECOMMENDATION_WEIGHTS.energy *
      clamp(
        energyCompatibility,
        0,
        1
      ) +
    RECOMMENDATION_WEIGHTS.preference *
      preference +
    RECOMMENDATION_WEIGHTS.novelty *
      novelty;

  return {
    finalScore,
    breakdown: {
      moodCompatibility: clamp(
        moodCompatibility,
        0,
        1
      ),
      energyCompatibility: clamp(
        energyCompatibility,
        0,
        1
      ),
      preference,
      novelty,
    },
  };
}

/**
 * Fill in genre-based estimates when they are missing.
 */
function withGenreEstimates(track) {
  if (!track) {
    return null;
  }

  if (
    track.energyEstimate != null &&
    track.valenceEstimate != null
  ) {
    return track;
  }

  const genreKey = String(
    track.genre || ''
  )
    .toLowerCase()
    .trim();

  const profile =
    GENRE_PROFILES[genreKey];

  if (!profile) {
    return track;
  }

  return {
    ...track,
    energyEstimate:
      track.energyEstimate ??
      profile.energy,
    valenceEstimate:
      track.valenceEstimate ??
      profile.valence,
  };
}

/**
 * Rank tracks against a target mood.
 *
 * IMPORTANT:
 * This function is intentionally defensive.
 * API/database results can sometimes be undefined,
 * null, or an object instead of an array.
 *
 * Instead of crashing on:
 *
 *     itunesItems.map(...)
 *
 * we safely convert invalid input into an empty array.
 */
export function rankTracks(
  itunesItems,
  target,
  context = {}
) {
  const safeItems = Array.isArray(
    itunesItems
  )
    ? itunesItems
    : [];

  const safeTarget = {
    valence:
      typeof target?.valence === 'number'
        ? target.valence
        : 0,
    arousal:
      typeof target?.arousal === 'number'
        ? target.arousal
        : 0.5,
  };

  return safeItems
    .filter(
      (item) =>
        item &&
        typeof item === 'object'
    )
    .map((item) => {
      const base =
        item.source
          ? item
          : toTrackFeatures(item);

      if (!base) {
        return null;
      }

      const features =
        withGenreEstimates(base);

      if (!features) {
        return null;
      }

      const { finalScore } =
        scoreTrack(
          features,
          safeTarget,
          context
        );

      return {
        ...features,
        score: finalScore,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) => b.score - a.score
    );
}

// --- Match My Mood vs. Improve My Mood -------------------------------

/**
 * A generally positive, moderately-energized
 * anchor point to move toward.
 */
const FEEL_BETTER_ANCHOR = {
  valence: 0.7,
  arousal: 0.55,
};

const IMPROVE_STAGE_FRACTIONS = [
  0.3,
  0.6,
  0.9,
];

const IMPROVE_STAGE_LABELS = [
  'Comforting',
  'Lifting',
  'Uplifting',
];

/**
 * Match My Mood.
 */
export function matchMyMoodTarget(
  moodState
) {
  return {
    valence:
      moodState?.valence ?? 0,
    arousal:
      moodState?.arousal ?? 0.5,
  };
}

/**
 * Improve My Mood.
 */
export function buildImproveMyMoodStages(
  moodState
) {
  const safeMoodState = {
    valence:
      typeof moodState?.valence ===
      'number'
        ? moodState.valence
        : 0,
    arousal:
      typeof moodState?.arousal ===
      'number'
        ? moodState.arousal
        : 0.5,
  };

  return IMPROVE_STAGE_FRACTIONS.map(
    (fraction, index) => ({
      label:
        IMPROVE_STAGE_LABELS[index],
      valence: clamp(
        safeMoodState.valence +
          (FEEL_BETTER_ANCHOR.valence -
            safeMoodState.valence) *
            fraction,
        -1,
        1
      ),
      arousal: clamp(
        safeMoodState.arousal +
          (FEEL_BETTER_ANCHOR.arousal -
            safeMoodState.arousal) *
            fraction,
        0,
        1
      ),
    })
  );
}

/**
 * Generate candidate search terms for a mood state.
 */
export function buildMoodSearchTerms(
  moodState
) {
  const safeMoodState =
    moodState || {};

  const arousal =
    typeof safeMoodState.arousal ===
    'number'
      ? safeMoodState.arousal
      : 0.5;

  const energetic =
    arousal >= 0.6;

  const mellow =
    arousal < 0.35;

  switch (
    safeMoodState.primaryMood
  ) {
    case 'happy':
      return energetic
        ? ['feel good upbeat pop']
        : ['happy easy listening'];

    case 'excited':
      return [
        'high energy dance pop',
        'upbeat workout',
      ];

    case 'calm':
      return [
        'calm acoustic chill',
      ];

    case 'sad':
      return mellow
        ? ['sad acoustic ballad']
        : ['emotional alternative'];

    case 'angry':
      return [
        'intense rock',
        'high energy alternative',
      ];

    case 'anxious':
      return [
        'calming ambient instrumental',
      ];

    case 'neutral':
    default:
      return [
        'chill indie pop',
      ];
  }
}

/**
 * Weather as a recommendation nudge only.
 */
export function weatherSearchModifier(
  weather
) {
  if (
    !weather ||
    !weather.available
  ) {
    return [];
  }

  const terms = [];

  if (weather.isRaining) {
    terms.push(
      'rainy day acoustic'
    );
  }

  if (
    weather.condition === 'snow'
  ) {
    terms.push(
      'cozy winter chill'
    );
  }

  if (
    weather.condition === 'clear' &&
    weather.isDaytime
  ) {
    terms.push(
      'sunny day feel good'
    );
  }

  if (
    !weather.isDaytime &&
    (
      weather.condition ===
        'clear' ||
      weather.condition ===
        'fog'
    )
  ) {
    terms.push(
      'late night chill'
    );
  }

  return terms;
}

