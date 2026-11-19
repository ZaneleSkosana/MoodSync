/**
 * Converts a FacialEmotionResult (probabilities per discrete emotion) into
 * the valence/arousal representation described in the mood-detection spec,
 * then classifies a primaryMood from that.
 *
 * This intentionally does NOT do `mood = highest emotion`. Two reasons:
 *  1. A single dominant likelihood throws away information about how mixed
 *     the expression actually was (e.g. joy=0.4, surprise=0.35 is a very
 *     different state than joy=0.9, surprise=0.02, but "highest wins" would
 *     call both "joy").
 *  2. Some emotions (anger vs. surprise, in particular) are not equivalent
 *     to the mood labels this app used to map them to 1:1.
 *
 * The weights below are a deliberately simple implementation of Russell's
 * circumplex model of affect (valence x arousal). They are estimates, not
 * measured psychophysiology - documented in moodTypes.js's PRIVACY_NOTE.
 *
 * This file has NO React Native / Expo imports on purpose, so it can be unit
 * tested with plain Node (see app/services/mood/__tests__).
 */

import {
  UNCERTAIN_CONFIDENCE_THRESHOLD,
  NEUTRAL_VALENCE_BAND,
  AROUSAL_LOW_MAX,
  AROUSAL_HIGH_MIN,
} from './moodTypes';

// Circumplex placement per discrete emotion. Tune here only.
const VALENCE_WEIGHTS = {
  joy: 0.9,
  sorrow: -0.85,
  anger: -0.65,
  surprise: 0.1, // surprise is valence-ambiguous; kept close to neutral
  neutral: 0,
};

const AROUSAL_WEIGHTS = {
  joy: 0.55,
  sorrow: 0.25,
  anger: 0.8,
  surprise: 0.9,
  neutral: 0.15,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * @param {{joy:number, sorrow:number, anger:number, surprise:number, neutral:number}} emotions
 * @returns {{joy:number, sorrow:number, anger:number, surprise:number, neutral:number}}
 */
export function normalizeEmotions(emotions) {
  const keys = ['joy', 'sorrow', 'anger', 'surprise', 'neutral'];
  const sum = keys.reduce((total, key) => total + (emotions[key] || 0), 0);

  if (sum <= 0) {
    // No signal at all - treat every emotion as equally (un)likely rather
    // than dividing by zero or silently returning the raw (all-zero) input.
    return { joy: 0.2, sorrow: 0.2, anger: 0.2, surprise: 0.2, neutral: 0.2 };
  }

  return keys.reduce((acc, key) => {
    acc[key] = (emotions[key] || 0) / sum;
    return acc;
  }, {});
}

/**
 * @param {{joy:number, sorrow:number, anger:number, surprise:number, neutral:number}} emotions
 * @returns {{valence:number, arousal:number}}
 */
export function emotionsToValenceArousal(emotions) {
  const normalized = normalizeEmotions(emotions);

  const valence = clamp(
    Object.keys(VALENCE_WEIGHTS).reduce(
      (sum, key) => sum + normalized[key] * VALENCE_WEIGHTS[key],
      0
    ),
    -1,
    1
  );

  const arousal = clamp(
    Object.keys(AROUSAL_WEIGHTS).reduce(
      (sum, key) => sum + normalized[key] * AROUSAL_WEIGHTS[key],
      0
    ),
    0,
    1
  );

  return { valence, arousal };
}

function arousalBucket(arousal) {
  if (arousal < AROUSAL_LOW_MAX) return 'low';
  if (arousal < AROUSAL_HIGH_MIN) return 'mid';
  return 'high';
}

/**
 * Classifies a PrimaryMood from valence/arousal + the raw normalized
 * emotions (used only to disambiguate angry vs. anxious, which occupy a
 * similar region of the valence/arousal plane but are distinct emotions).
 *
 * @param {number} valence -1..1
 * @param {number} arousal 0..1
 * @param {number} confidence 0..1
 * @param {{joy:number, sorrow:number, anger:number, surprise:number, neutral:number}} [normalizedEmotions]
 * @returns {import('./moodTypes').PrimaryMood}
 */
export function classifyPrimaryMood(
  valence,
  arousal,
  confidence,
  normalizedEmotions = { joy: 0, sorrow: 0, anger: 0, surprise: 0, neutral: 1 }
) {
  if (confidence < UNCERTAIN_CONFIDENCE_THRESHOLD) {
    return 'uncertain';
  }

  const bucket = arousalBucket(arousal);

  if (valence > NEUTRAL_VALENCE_BAND) {
    if (bucket === 'low') return 'calm';
    if (bucket === 'mid') return 'happy';
    return 'excited';
  }

  if (valence < -NEUTRAL_VALENCE_BAND) {
    if (bucket === 'low') return 'sad';
    // Mid/high arousal + negative valence: anger and anxiety sit in a
    // similar region of the valence/arousal plane, so fall back to whichever
    // discrete emotion actually dominated the facial signal.
    return normalizedEmotions.anger >= normalizedEmotions.surprise
      ? 'angry'
      : 'anxious';
  }

  // Roughly neutral valence.
  if (bucket === 'high') {
    // A high-arousal spike with flat valence is more likely mild
    // anxiety/tension than genuine happiness or anger - avoid mislabeling it.
    return normalizedEmotions.surprise >= normalizedEmotions.anger
      ? 'anxious'
      : 'angry';
  }

  return 'neutral';
}

/**
 * Convenience wrapper: FacialEmotionResult -> {valence, arousal, primaryMood}
 * @param {import('./moodTypes').FacialEmotionResult} facial
 */
export function facialToMoodEstimate(facial) {
  const normalized = normalizeEmotions(facial);
  const { valence, arousal } = emotionsToValenceArousal(facial);
  const primaryMood = classifyPrimaryMood(
    valence,
    arousal,
    facial.confidence,
    normalized
  );
  return { valence, arousal, primaryMood, confidence: facial.confidence };
}
