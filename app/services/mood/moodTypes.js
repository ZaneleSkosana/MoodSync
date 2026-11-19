/**
 * Shared type definitions and tunable constants for the multimodal mood
 * engine. This project is plain JavaScript (no TypeScript toolchain is
 * configured), so these are documented with JSDoc typedefs rather than real
 * `interface`/`type` declarations. Editors that understand JSDoc (VS Code,
 * WebStorm) will still get autocomplete + inline docs from this file.
 *
 * IMPORTANT: nothing in this file (or anywhere in app/services/mood/) claims
 * to diagnose emotions or mental health. Everything here produces an
 * *estimate* with an explicit confidence value. See PRIVACY_NOTE at the
 * bottom for the wording rules the rest of the app should follow.
 */

/**
 * @typedef {Object} FacialEmotionResult
 * @property {number} joy         0..1 normalized likelihood
 * @property {number} sorrow      0..1 normalized likelihood
 * @property {number} anger       0..1 normalized likelihood
 * @property {number} surprise    0..1 normalized likelihood
 * @property {number} neutral     0..1 normalized likelihood (derived)
 * @property {number} confidence  0..1 overall confidence in this sample
 *   (combines Vision API detectionConfidence with our own quality checks:
 *   blur, exposure, head rotation, face size)
 * @property {boolean} faceDetected
 * @property {number} faceCount   how many faces were found in the frame
 * @property {boolean} multipleFaces
 * @property {string[]} qualityIssues  e.g. ['no_face'], ['blurry','poor_lighting']
 * @property {number} timestamp   Date.now() when the sample was captured
 */

/**
 * @typedef {Object} MoodSourceBreakdown
 * @property {number} facial       0..1 weight actually applied
 * @property {number} heartRate    0..1 weight actually applied
 * @property {number} history      0..1 weight actually applied
 * @property {number} environment  0..1 weight actually applied
 * @property {number} activity     0..1 weight actually applied
 */

/**
 * @typedef {'happy'|'sad'|'calm'|'excited'|'angry'|'anxious'|'neutral'|'uncertain'} PrimaryMood
 */

/**
 * @typedef {Object} MoodState
 * @property {number} valence      -1..1 (negative -> positive)
 * @property {number} arousal      0..1 (low -> high energy)
 * @property {number} confidence   0..1
 * @property {PrimaryMood} primaryMood
 * @property {MoodSourceBreakdown} source  how much each available signal
 *   actually contributed after redistribution of missing-signal weight
 * @property {number} timestamp
 */

/**
 * @typedef {Object} CalibrationBaseline
 * @property {number} joy
 * @property {number} sorrow
 * @property {number} anger
 * @property {number} surprise
 * @property {number} neutral
 * @property {number} sampleCount  how many frames were averaged into this
 */

/**
 * @typedef {Object} TrackFeatures
 * @property {string} source          'itunes' (only real, working source today)
 * @property {string} id              source-scoped id, always a string
 * @property {string} title
 * @property {string} artist
 * @property {string} [genre]         only present when the source provided it
 * @property {number} [energyEstimate]  0..1, heuristic from genre - NOT a
 *   measured audio feature. iTunes does not expose real energy/valence/BPM.
 * @property {number} [valenceEstimate] -1..1, heuristic from genre
 * @property {number} duration        seconds
 * @property {string} [coverArt]
 * @property {string} trackUrl        30s preview URL
 */

// ---------------------------------------------------------------------------
// Configurable weights (spec section 13 / 15). Nothing in the fusion engine
// or recommendation engine hard-codes these numbers inline - change them
// here and both engines pick up the new values.
// ---------------------------------------------------------------------------

/** Mood-fusion signal weights. Must sum to 1. */
export const MOOD_WEIGHTS = Object.freeze({
  facial: 0.45,
  heartRate: 0.15,
  history: 0.15,
  environment: 0.15,
  activity: 0.1,
});

/** Track-ranking weights for the recommendation engine. Must sum to 1. */
export const RECOMMENDATION_WEIGHTS = Object.freeze({
  mood: 0.4,
  energy: 0.25,
  preference: 0.2,
  novelty: 0.15,
});

/** Below this confidence, the engine reports 'uncertain' instead of guessing. */
export const UNCERTAIN_CONFIDENCE_THRESHOLD = 0.35;

/** Valence magnitude below this is treated as "roughly neutral". */
export const NEUTRAL_VALENCE_BAND = 0.15;

/** Arousal bucket boundaries. */
export const AROUSAL_LOW_MAX = 0.35;
export const AROUSAL_HIGH_MIN = 0.6;

export const PRIMARY_MOODS = [
  'happy',
  'sad',
  'calm',
  'excited',
  'angry',
  'anxious',
  'neutral',
  'uncertain',
];

/**
 * The five poses the optional personal-calibration flow asks for (spec
 * section 8). "Neutral" is the important one - it's the reference point
 * used to correct for a user's individual resting-face bias. The other four
 * are stored too (and used for a modest confidence nudge when a live
 * reading closely matches one), but are never required for the app to work.
 */
export const CALIBRATION_LABELS = ['Neutral', 'Happy', 'Calm', 'Energetic', 'Sad'];

/**
 * Wording rules for anything shown to the user about detected mood.
 * Use "estimated mood", "detected expression", "confidence" - never
 * "diagnosed", "mental state diagnosis" or "psychological assessment".
 */
export const PRIVACY_NOTE =
  'MoodSync estimates a mood from facial expression and other available ' +
  'signals. This is not a medical or psychological assessment.';
