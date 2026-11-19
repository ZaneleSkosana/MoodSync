import { PLAYLIST_MOODS } from './constants';

// How many mood check-ins we treat as "fully arrived" at the goal, for
// blending playlist genres only. The journey itself still only completes
// when the logged mood actually equals the goal mood — this just controls
// how gradually the music shifts toward the goal in the meantime.
export const TARGET_JOURNEY_STEPS = 5;

// Blends two moods' genre lists based on progress (0 = fully the current
// mood, 1 = fully the goal mood), so playlists gradually shift from where
// the user started toward where they want to end up.
export const getBlendedGenres = (currentMood, goalMood, progress) => {
  const currentGenres = PLAYLIST_MOODS[currentMood] || ['Pop'];
  const goalGenres = PLAYLIST_MOODS[goalMood] || ['Pop'];

  if (!goalMood || currentMood === goalMood) {
    return currentGenres;
  }

  const totalSlots = 3;
  const goalSlots = Math.round(progress * totalSlots);
  const currentSlots = totalSlots - goalSlots;

  const picked = [
    ...currentGenres.slice(0, currentSlots),
    ...goalGenres.slice(0, goalSlots),
  ];

  return [...new Set(picked)];
};