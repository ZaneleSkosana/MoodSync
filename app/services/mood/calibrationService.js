/**
 * Optional personal calibration (spec section 8).
 *
 * The point is NOT to diagnose the user - it's to learn what THIS user's
 * face tends to look like to the generic Vision model, so a systematic
 * quirk (e.g. someone whose resting/neutral face reads as mild "sorrow" to
 * the generic model) doesn't get misread as an emotion every single time.
 *
 * Storage: AsyncStorage, on-device only, one small JSON blob per user - no
 * Supabase migration needed, and nothing here requires calibration to
 * exist before the app works (see applyCalibration's early-return).
 *
 * The math itself (averaging samples, computing/applying the correction)
 * has no React Native imports and is unit-testable with plain Node;
 * AsyncStorage is only touched by the get/save/clear functions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CALIBRATION_LABELS } from './moodTypes';

const CALIBRATION_KEY_PREFIX = 'moodsync:calibration:';
const EMOTION_KEYS = ['joy', 'sorrow', 'anger', 'surprise', 'neutral'];

// If a live reading is this close (Euclidean distance across the 5 emotion
// fields) to one of the user's own posed baselines, we have direct personal
// precedent for what that expression means for them - worth a small
// confidence nudge, not a valence/arousal override.
const BASELINE_MATCH_DISTANCE = 0.25;
const BASELINE_MATCH_CONFIDENCE_BONUS = 0.08;

function key(userId) {
  return `${CALIBRATION_KEY_PREFIX}${userId || 'anonymous'}`;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * @param {Array<import('./moodTypes').FacialEmotionResult>} samples
 * @returns {import('./moodTypes').CalibrationBaseline|null}
 */
export function averageSamples(samples) {
  const usable = (samples || []).filter((s) => s && s.faceDetected);
  if (!usable.length) return null;

  const totals = EMOTION_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {});
  usable.forEach((sample) => {
    EMOTION_KEYS.forEach((k) => {
      totals[k] += sample[k] || 0;
    });
  });

  const averaged = EMOTION_KEYS.reduce(
    (acc, k) => ({ ...acc, [k]: totals[k] / usable.length }),
    {}
  );
  return { ...averaged, sampleCount: usable.length };
}

/** @returns {Promise<Object<string, import('./moodTypes').CalibrationBaseline>|null>} */
export async function getCalibration(userId) {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.log('calibrationService: getCalibration failed', error.message);
    return null;
  }
}

export async function hasCalibration(userId) {
  const calibration = await getCalibration(userId);
  return !!(calibration && calibration.Neutral);
}

/**
 * @param {string} userId
 * @param {string} label one of CALIBRATION_LABELS
 * @param {Array<import('./moodTypes').FacialEmotionResult>} samples
 */
export async function saveBaseline(userId, label, samples) {
  if (!CALIBRATION_LABELS.includes(label)) {
    throw new Error(`Unknown calibration label: ${label}`);
  }
  const baseline = averageSamples(samples);
  if (!baseline) return { success: false, error: 'No usable samples (face not detected).' };

  try {
    const existing = (await getCalibration(userId)) || {};
    const next = { ...existing, [label]: baseline };
    await AsyncStorage.setItem(key(userId), JSON.stringify(next));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function clearCalibration(userId) {
  try {
    await AsyncStorage.removeItem(key(userId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function euclideanDistance(a, b) {
  return Math.sqrt(
    EMOTION_KEYS.reduce((sum, k) => sum + (a[k] - (b[k] || 0)) ** 2, 0)
  );
}

/**
 * Corrects a raw FacialEmotionResult using this user's stored calibration.
 * Pure passthrough (returns `facial` unchanged) when there's no calibration
 * yet - calibration is always optional, per spec.
 *
 * @param {import('./moodTypes').FacialEmotionResult} facial
 * @param {Object<string, import('./moodTypes').CalibrationBaseline>|null} calibration
 * @returns {import('./moodTypes').FacialEmotionResult}
 */
export function applyCalibration(facial, calibration) {
  if (!facial || !facial.faceDetected || !calibration || !calibration.Neutral) {
    return facial;
  }

  const bias = calibration.Neutral;
  const corrected = {
    ...facial,
    joy: clamp(facial.joy - bias.joy, 0, 1),
    sorrow: clamp(facial.sorrow - bias.sorrow, 0, 1),
    anger: clamp(facial.anger - bias.anger, 0, 1),
    surprise: clamp(facial.surprise - bias.surprise, 0, 1),
  };

  // Small, capped confidence nudge if this reading closely matches one of
  // the user's own posed non-neutral baselines - direct personal precedent,
  // not a generic-model guess.
  const nonNeutralLabels = CALIBRATION_LABELS.filter((l) => l !== 'Neutral' && calibration[l]);
  const isCloseToAPose = nonNeutralLabels.some(
    (label) => euclideanDistance(facial, calibration[label]) < BASELINE_MATCH_DISTANCE
  );
  if (isCloseToAPose) {
    corrected.confidence = clamp(facial.confidence + BASELINE_MATCH_CONFIDENCE_BONUS, 0, 1);
  }

  return corrected;
}
