/**
 * Activity/motion signal (spec section 10).
 *
 * Classifies into a coarse, honest set - stationary / walking / running /
 * vehicle / unknown - rather than pretending to distinguish things like
 * cycling from brisk walking, which isn't reliably possible from a phone
 * accelerometer + GPS speed alone without a dedicated ML model this project
 * doesn't have. "unknown" is a real, expected outcome, not a bug.
 *
 * Battery/perf (spec section 27): samples the accelerometer for a short,
 * fixed window (default 2s) when explicitly asked, then immediately removes
 * the listener. There is no background/continuous polling anywhere in this
 * file - it only ever runs once, synchronously with a detection request.
 *
 * No React Native imports beyond expo-sensors - the classification math
 * itself is plain functions, unit-testable with plain Node.
 */

import { Accelerometer } from 'expo-sensors';

const SAMPLE_DURATION_MS = 2000;
const SAMPLE_INTERVAL_MS = 100;

// Thresholds on the standard deviation of acceleration magnitude (in g).
// A phone sitting still still reads ~1g steady (gravity) with near-zero
// variance; walking/running introduce rhythmic swings on top of that.
const STATIONARY_MAX_STD = 0.03;
const WALKING_MAX_STD = 0.18;

// GPS speed (m/s) thresholds - walking tops out around 2 m/s (~7km/h) for
// almost everyone; sustained speed above that without matching accelerometer
// variance strongly suggests a vehicle rather than a person moving that fast.
const VEHICLE_MIN_SPEED_MPS = 4;

export async function isAvailable() {
  try {
    return await Accelerometer.isAvailableAsync();
  } catch (error) {
    return false;
  }
}

function magnitude({ x, y, z }) {
  return Math.sqrt(x * x + y * y + z * z);
}

function standardDeviation(values) {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * @param {number} std standard deviation of acceleration magnitude (g)
 * @param {number|null} speedMps GPS speed if available, else null
 * @returns {'stationary'|'walking'|'running'|'vehicle'|'unknown'}
 */
export function classifyMotion(std, speedMps = null) {
  if (speedMps != null && speedMps >= VEHICLE_MIN_SPEED_MPS && std <= WALKING_MAX_STD) {
    // Moving fast but the phone itself isn't shaking around like it would
    // in a hand/pocket while walking or running -> most likely a vehicle.
    return 'vehicle';
  }
  if (std <= STATIONARY_MAX_STD) return 'stationary';
  if (std <= WALKING_MAX_STD) return 'walking';
  return 'running';
}

/**
 * @param {Object} [options]
 * @param {number} [options.speedMps] optional GPS speed from locationService
 * @param {number} [options.durationMs]
 * @returns {Promise<{available:boolean, state?:string}>}
 */
export async function sampleActivity({ speedMps = null, durationMs = SAMPLE_DURATION_MS } = {}) {
  const available = await isAvailable();
  if (!available) return { available: false };

  return new Promise((resolve) => {
    const magnitudes = [];
    let subscription = null;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (subscription) subscription.remove();
      resolve(result);
    };

    try {
      Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
      subscription = Accelerometer.addListener((data) => {
        magnitudes.push(magnitude(data));
      });
    } catch (error) {
      finish({ available: false });
      return;
    }

    setTimeout(() => {
      if (magnitudes.length < 3) {
        finish({ available: false });
        return;
      }
      const std = standardDeviation(magnitudes);
      finish({ available: true, state: classifyMotion(std, speedMps) });
    }, durationMs);
  });
}
