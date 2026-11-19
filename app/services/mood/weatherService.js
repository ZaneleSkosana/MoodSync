/**
 * Weather signal (spec section 11).
 *
 * IMPORTANT: per spec, weather must never determine or feed into the
 * user's detected mood - it's a contextual signal for the *recommendation*
 * engine only ("rainy evening" nudging search terms toward calm/acoustic),
 * not a moodFusionEngine input. There is no weight for it in MOOD_WEIGHTS
 * and it should stay that way; see recommendationEngine.js's
 * weatherSearchModifier for how it's actually used.
 *
 * Uses Open-Meteo (https://open-meteo.com) - free, no API key, no signup,
 * same "no key required" pattern already used for iTunes search elsewhere
 * in this project. WMO weather codes: https://open-meteo.com/en/docs
 */

const WMO_RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const WMO_SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const WMO_STORM_CODES = new Set([95, 96, 99]);
const WMO_FOG_CODES = new Set([45, 48]);
const WMO_CLOUDY_CODES = new Set([2, 3]);

function classifyWeatherCode(code) {
  if (WMO_STORM_CODES.has(code)) return 'storm';
  if (WMO_SNOW_CODES.has(code)) return 'snow';
  if (WMO_RAIN_CODES.has(code)) return 'rain';
  if (WMO_FOG_CODES.has(code)) return 'fog';
  if (WMO_CLOUDY_CODES.has(code)) return 'cloudy';
  return 'clear'; // codes 0, 1
}

/**
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{available:boolean, condition?:string, isRaining?:boolean,
 *   isDaytime?:boolean, temperatureC?:number}>}
 */
export async function getCurrentWeather(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { available: false };
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,weather_code,is_day&timezone=auto`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return { available: false };

    const data = await response.json();
    const current = data.current;
    if (!current) return { available: false };

    const condition = classifyWeatherCode(current.weather_code);

    return {
      available: true,
      condition,
      isRaining: condition === 'rain' || condition === 'storm',
      isDaytime: current.is_day === 1,
      temperatureC: typeof current.temperature_2m === 'number' ? current.temperature_2m : null,
    };
  } catch (error) {
    console.log('weatherService: getCurrentWeather failed', error.message);
    return { available: false };
  }
}
