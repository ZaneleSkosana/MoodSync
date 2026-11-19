/**
 * MoodFusionEngine - combines whatever signals are actually available
 * (facial expression, heart rate, mood history, selected environment) into
 * a single MoodState.
 *
 * Design rules (see moodTypes.js for the weights/thresholds referenced here):
 *  - Facial and mood-history each carry their own valence AND arousal
 *    estimate. Heart rate and environment only ever inform arousal - they
 *    have no way to know whether the user feels good or bad, only how
 *    "activated" the context tends to be, so their valence contribution is
 *    an explicit, documented neutral (0), not a guess.
 *  - If a signal is unavailable, it is dropped entirely and the remaining
 *    signals' weights are renormalized to sum to 1 (proportional
 *    redistribution), never treated as a silent 0 vote.
 *  - Confidence is anchored on the facial reading (the only true
 *    in-the-moment measurement) and nudged up/down slightly by whether the
 *    other available signals corroborate or conflict with it - it is not
 *    penalized merely for having fewer signals available, since
 *    facial-only detection is the common case and should still work well.
 *  - If literally nothing is available, the engine returns a clearly
 *    'uncertain' MoodState with confidence 0 rather than throwing or
 *    fabricating a guess - callers should fall back to manual mood
 *    selection in that case.
 *
 * No React Native imports - pure logic, unit-testable with plain Node.
 */

import { MOOD_WEIGHTS, UNCERTAIN_CONFIDENCE_THRESHOLD } from './moodTypes';
import { facialToMoodEstimate, normalizeEmotions, classifyPrimaryMood } from './valenceArousal';
import { deriveHistorySignal } from './historySignal';
import { bpmToArousal } from './heartRateProvider';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Environment options are a small fixed set (app/utils/constants.js). This
// is a mild, explicitly-arousal-only prior - "gym" doesn't mean happy or
// sad, it just tends to be a higher-energy setting than "library".
const ENVIRONMENT_AROUSAL_PRIOR = {
  Library: 0.2,
  Office: 0.3,
  Home: 0.35,
  Kitchen: 0.45,
  Walk: 0.5,
  Gym: 0.75,
};

// Same idea for physical activity (spec section 10): a coarse motion state
// is a prior on how physiologically "activated" the user's body currently
// is, not on whether they feel good or bad about it. "vehicle" is kept
// deliberately modest since it's ambiguous (relaxed passenger vs. stressed
// commute look the same to an accelerometer).
const ACTIVITY_AROUSAL_PRIOR = {
  stationary: 0.15,
  walking: 0.45,
  running: 0.85,
  vehicle: 0.4,
};

/**
 * @param {Object} inputs
 * @param {import('./moodTypes').FacialEmotionResult|null} [inputs.facial]
 * @param {{available:boolean, bpm:number|null}|null} [inputs.heartRate]
 * @param {Array|null} [inputs.moodHistory]
 * @param {{name:string}|null} [inputs.environment]
 * @param {{available:boolean, state:string}|null} [inputs.activity]
 * @param {number} [inputs.now] injectable for tests
 * @returns {import('./moodTypes').MoodState}
 */
export function fuseMoodSignals({
  facial = null,
  heartRate = null,
  moodHistory = null,
  environment = null,
  activity = null,
  now = Date.now(),
} = {}) {
  const signals = {};

  // --- Facial -------------------------------------------------------
  if (facial && facial.faceDetected && facial.confidence > 0) {
    const normalized = normalizeEmotions(facial);
    const est = facialToMoodEstimate(facial);
    signals.facial = {
      valence: est.valence,
      arousal: est.arousal,
      confidence: facial.confidence,
      normalizedEmotions: normalized,
    };
  }

  // --- Heart rate (arousal only, valence intentionally neutral) -----
  if (heartRate && heartRate.available && heartRate.bpm != null) {
    const arousal = bpmToArousal(heartRate.bpm);
    if (arousal != null) {
      signals.heartRate = { valence: 0, arousal, confidence: 1 };
    }
  }

  // --- Mood history ---------------------------------------------------
  const history = deriveHistorySignal(moodHistory || [], now);
  if (history.available) {
    signals.history = {
      valence: history.valence,
      arousal: history.arousal,
      confidence: clamp(0.3 + history.sampleCount * 0.1, 0.3, 0.7),
    };
  }

  // --- Environment (arousal only, valence intentionally neutral) ----
  if (environment && environment.name && ENVIRONMENT_AROUSAL_PRIOR[environment.name] != null) {
    signals.environment = {
      valence: 0,
      arousal: ENVIRONMENT_AROUSAL_PRIOR[environment.name],
      confidence: 1,
    };
  }

  // --- Activity / motion (arousal only, valence intentionally neutral) --
  if (activity && activity.available && ACTIVITY_AROUSAL_PRIOR[activity.state] != null) {
    signals.activity = {
      valence: 0,
      arousal: ACTIVITY_AROUSAL_PRIOR[activity.state],
      confidence: 1,
    };
  }

  const availableKeys = Object.keys(signals);

  if (availableKeys.length === 0) {
    return {
      valence: 0,
      arousal: 0,
      confidence: 0,
      primaryMood: 'uncertain',
      source: { facial: 0, heartRate: 0, history: 0, environment: 0, activity: 0 },
      timestamp: now,
    };
  }

  const totalWeight = availableKeys.reduce((sum, key) => sum + MOOD_WEIGHTS[key], 0);
  /** @type {import('./moodTypes').MoodSourceBreakdown} */
  const sourceBreakdown = { facial: 0, heartRate: 0, history: 0, environment: 0, activity: 0 };

  let valence = 0;
  let arousal = 0;

  for (const key of availableKeys) {
    const normalizedWeight = MOOD_WEIGHTS[key] / totalWeight;
    sourceBreakdown[key] = normalizedWeight;
    valence += signals[key].valence * normalizedWeight;
    arousal += signals[key].arousal * normalizedWeight;
  }

  valence = clamp(valence, -1, 1);
  arousal = clamp(arousal, 0, 1);

  // Confidence: anchor on facial when present (it's the only direct,
  // in-the-moment reading); otherwise fall back to the strongest available
  // signal's own confidence. Then nudge for corroboration/conflict.
  let confidence = signals.facial
    ? signals.facial.confidence
    : Math.max(...availableKeys.map((k) => signals[k].confidence));

  if (signals.facial && signals.history) {
    const sameDirection =
      Math.sign(signals.facial.valence) === Math.sign(signals.history.valence) ||
      Math.abs(signals.facial.valence) < 0.1 ||
      Math.abs(signals.history.valence) < 0.1;
    confidence = clamp(confidence + (sameDirection ? 0.05 : -0.1), 0, 1);
  }

  const normalizedEmotionsForClassification = signals.facial
    ? signals.facial.normalizedEmotions
    : { joy: 0, sorrow: 0, anger: 0, surprise: 0, neutral: 1 };

  const primaryMood = classifyPrimaryMood(
    valence,
    arousal,
    confidence,
    normalizedEmotionsForClassification
  );

  return {
    valence,
    arousal,
    confidence,
    primaryMood,
    source: sourceBreakdown,
    timestamp: now,
  };
}

export function isUncertain(moodState) {
  return (
    moodState.primaryMood === 'uncertain' ||
    moodState.confidence < UNCERTAIN_CONFIDENCE_THRESHOLD
  );
}
