/**
 * Heart rate provider interface.
 *
 * IMPORTANT: there is currently no wearable/HealthKit/Google Fit/BLE
 * integration in this project, and no dependency for one
 * (react-native-health, react-native-google-fit, a BLE heart-rate-monitor
 * library, etc. are all absent from package.json). Nothing in this codebase
 * fabricated a heart rate before this change either - a repo-wide search
 * for "bpm"/"heart rate" turned up nothing outside this new file - so there
 * was no fake-BPM bug to remove here. This file exists so that:
 *
 *  1. The mood fusion engine has a stable shape to call regardless of
 *     whether real heart-rate hardware is ever wired up.
 *  2. Nobody is tempted to hard-code a placeholder number later - the
 *     default provider always returns null and isAvailable() => false.
 *
 * To add real heart-rate support later, implement this interface against
 * whichever SDK you choose (Apple HealthKit via `expo-health` /
 * `react-native-health`, Google Fit, or a direct BLE heart-rate-monitor
 * connection) and swap `unavailableHeartRateProvider` for it wherever it's
 * used (currently only moodFusionEngine's default).
 *
 * @typedef {Object} HeartRateProvider
 * @property {() => Promise<boolean>} isAvailable
 * @property {() => Promise<void>} start
 * @property {() => Promise<void>} stop
 * @property {() => Promise<number|null>} getCurrentHeartRate
 */

/** @type {HeartRateProvider} */
export const unavailableHeartRateProvider = {
  isAvailable: async () => false,
  start: async () => {},
  stop: async () => {},
  getCurrentHeartRate: async () => null,
};

/**
 * Reads a heart-rate sample from a provider in a way the fusion engine can
 * consume, and is honest about unavailability rather than ever defaulting
 * to a placeholder number.
 *
 * @param {HeartRateProvider} provider
 * @returns {Promise<{ available: boolean, bpm: number|null }>}
 */
export async function readHeartRate(provider = unavailableHeartRateProvider) {
  try {
    const available = await provider.isAvailable();
    if (!available) {
      return { available: false, bpm: null };
    }
    const bpm = await provider.getCurrentHeartRate();
    return { available: bpm != null, bpm: bpm ?? null };
  } catch (error) {
    console.log('heartRateProvider: read failed', error);
    return { available: false, bpm: null };
  }
}

/**
 * Very rough heuristic mapping from BPM to a 0..1 arousal contribution, used
 * only when a real provider is plugged in. Resting-ish (~60bpm) -> low
 * arousal, elevated (~120bpm+) -> high arousal. This is NOT a clinical
 * mapping - it's a coarse signal, weighted low in MOOD_WEIGHTS on purpose.
 * @param {number} bpm
 */
export function bpmToArousal(bpm) {
  if (typeof bpm !== 'number' || Number.isNaN(bpm)) return null;
  const clamped = Math.max(50, Math.min(160, bpm));
  return (clamped - 50) / (160 - 50);
}
