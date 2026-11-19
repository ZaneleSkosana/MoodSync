/**
 * Derives a lightweight "history" signal for the mood fusion engine from
 * the user's recent mood history (app/store/moodStore.js).
 *
 * Existing mood-history rows only ever stored a free-text `mood_label`
 * (e.g. "Happy", "Calm") and an inconsistently-used `score` field (in one
 * screen it's actually a confidence value written into a "score" column, in
 * another it's a hard-coded 7) - so `score` isn't a trustworthy valence
 * proxy on its own. Newer rows saved by the rebuilt Detect screen also carry
 * real `valence`/`arousal` numbers; when present, those are used directly
 * instead of the label lookup.
 *
 * The idea: someone who has logged several "Sad"/low-valence entries in the
 * last day is statistically more likely to still be in a lower mood than
 * the general population, so this nudges (not overrides) the facial signal.
 * Weighted low in MOOD_WEIGHTS on purpose - it's a mild prior, not a
 * replacement for the current in-the-moment reading.
 *
 * No React Native imports - pure logic, unit-testable with plain Node.
 */

// Fallback valence/arousal for legacy rows that only have a mood_label.
const LABEL_ESTIMATES = {
  Happy: { valence: 0.7, arousal: 0.55 },
  Sad: { valence: -0.7, arousal: 0.3 },
  Stressed: { valence: -0.5, arousal: 0.75 },
  Motivated: { valence: 0.5, arousal: 0.7 },
  Calm: { valence: 0.35, arousal: 0.2 },
  Energetic: { valence: 0.55, arousal: 0.85 },
  // New engine's own labels, in case history is read back through this path.
  happy: { valence: 0.7, arousal: 0.55 },
  sad: { valence: -0.7, arousal: 0.3 },
  calm: { valence: 0.35, arousal: 0.2 },
  excited: { valence: 0.7, arousal: 0.85 },
  angry: { valence: -0.6, arousal: 0.75 },
  anxious: { valence: -0.35, arousal: 0.75 },
  neutral: { valence: 0, arousal: 0.2 },
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Half-life for recency weighting - a 3-day-old entry counts ~half as much. */
const HALF_LIFE_DAYS = 3;

function entryToValenceArousal(entry) {
  if (typeof entry.valence === 'number' && typeof entry.arousal === 'number') {
    return { valence: entry.valence, arousal: entry.arousal };
  }
  const fallback = LABEL_ESTIMATES[entry.mood_label] || LABEL_ESTIMATES[entry.label];
  return fallback || null;
}

/**
 * @param {Array<{created_at?: string, mood_label?: string, label?: string, valence?: number, arousal?: number}>} moodHistory
 * @param {number} [now] injectable for tests
 * @returns {{ available: boolean, valence: number, arousal: number, sampleCount: number }}
 */
export function deriveHistorySignal(moodHistory, now = Date.now()) {
  if (!Array.isArray(moodHistory) || moodHistory.length === 0) {
    return { available: false, valence: 0, arousal: 0, sampleCount: 0 };
  }

  let weightedValence = 0;
  let weightedArousal = 0;
  let totalWeight = 0;
  let sampleCount = 0;

  for (const entry of moodHistory) {
    const estimate = entryToValenceArousal(entry);
    if (!estimate) continue;

    const createdAt = entry.created_at ? new Date(entry.created_at).getTime() : now;
    const ageDays = Math.max(0, (now - createdAt) / MS_PER_DAY);
    const weight = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);

    weightedValence += estimate.valence * weight;
    weightedArousal += estimate.arousal * weight;
    totalWeight += weight;
    sampleCount += 1;
  }

  if (totalWeight <= 0) {
    return { available: false, valence: 0, arousal: 0, sampleCount: 0 };
  }

  return {
    available: true,
    valence: weightedValence / totalWeight,
    arousal: weightedArousal / totalWeight,
    sampleCount,
  };
}
