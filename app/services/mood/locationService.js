/**
 * Location signal for the mood engine (spec section 12).
 *
 * Deliberately does NOT attempt to classify "this GPS point is a gym" from
 * coordinates alone - that needs a paid places/POI API this project doesn't
 * have configured, and guessing would be exactly the kind of fabricated
 * signal the rest of this app avoids. Instead: the user's own manual
 * environment picks (Library/Gym/Home/etc., from EnvironmentSelector) are
 * remembered against a *coarse, rounded* location the first time they're
 * made. On a later visit to a similar coarse location, that same tag is
 * suggested again automatically - still overridable, never silent.
 *
 * Privacy (spec section 22):
 *  - Coordinates are rounded to 3 decimal places (~110m) before ever being
 *    read by calling code or written to storage. Exact GPS is never kept.
 *  - Only a small, user-authored list of named places is stored (one entry
 *    per environment the user has ever tagged), not a location history.
 *  - Everything lives in AsyncStorage on-device - nothing here is sent to
 *    Supabase or any server.
 *  - If permission is denied, every function below resolves to an
 *    "unavailable" result rather than throwing - the rest of the mood
 *    engine already treats a missing signal as one to redistribute weight
 *    away from, not an error.
 *
 * No React Native imports beyond expo-location/AsyncStorage - safe to call
 * from any screen without pulling in UI concerns.
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COARSE_DECIMALS = 3; // ~111m at the equator - "which building", not "which desk"
const MATCH_RADIUS_METERS = 150;
const PLACES_KEY_PREFIX = 'moodsync:places:';

const round = (value, decimals) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/** Haversine distance in meters between two {latitude, longitude} points. */
function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export async function hasPermission() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}

export async function requestPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}

/**
 * @returns {Promise<{available:boolean, latitude?:number, longitude?:number, speedMps?:number|null}>}
 */
export async function getCoarseLocation() {
  try {
    const granted = await hasPermission();
    if (!granted) return { available: false };

    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) return { available: false };

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // no need for GPS-precise fixes here
    });

    return {
      available: true,
      latitude: round(position.coords.latitude, COARSE_DECIMALS),
      longitude: round(position.coords.longitude, COARSE_DECIMALS),
      // speed is meters/second when the platform supports it, else null -
      // used by activityService to help distinguish walking from a vehicle.
      speedMps: typeof position.coords.speed === 'number' && position.coords.speed >= 0
        ? position.coords.speed
        : null,
    };
  } catch (error) {
    console.log('locationService: getCoarseLocation failed', error.message);
    return { available: false };
  }
}

function placesKey(userId) {
  return `${PLACES_KEY_PREFIX}${userId || 'anonymous'}`;
}

/** @returns {Promise<Array<{name:string, latitude:number, longitude:number}>>} */
export async function getSavedPlaces(userId) {
  try {
    const raw = await AsyncStorage.getItem(placesKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.log('locationService: getSavedPlaces failed', error.message);
    return [];
  }
}

/**
 * Remembers "this environment name goes with roughly this coarse location"
 * for next time. Upserts by name - one location per environment tag, always
 * overwritten with the most recent tagging (not a growing history).
 */
export async function rememberPlace(userId, name, coarseLocation) {
  if (!userId || !name || !coarseLocation?.available) return;
  try {
    const places = await getSavedPlaces(userId);
    const next = places.filter((p) => p.name !== name);
    next.push({
      name,
      latitude: coarseLocation.latitude,
      longitude: coarseLocation.longitude,
    });
    await AsyncStorage.setItem(placesKey(userId), JSON.stringify(next));
  } catch (error) {
    console.log('locationService: rememberPlace failed', error.message);
  }
}

/**
 * @returns {Promise<string|null>} the name of the closest saved place within
 *   MATCH_RADIUS_METERS, or null if none is close enough (or none saved).
 */
export async function findNearbyPlace(userId, coarseLocation) {
  if (!coarseLocation?.available) return null;
  const places = await getSavedPlaces(userId);
  if (!places.length) return null;

  let best = null;
  let bestDistance = Infinity;
  for (const place of places) {
    const d = distanceMeters(coarseLocation, place);
    if (d < bestDistance) {
      bestDistance = d;
      best = place;
    }
  }

  return best && bestDistance <= MATCH_RADIUS_METERS ? best.name : null;
}
