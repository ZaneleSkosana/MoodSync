/**
 * The 8 "quick pick" moods shown on the Home screen grid and the Detect
 * screen's manual-override grid. This is a distinct, user-facing label set
 * from PRIMARY_MOODS (app/services/mood/moodTypes.js) - the engine's
 * internal detection vocabulary doesn't need to match the vocabulary shown
 * to someone manually picking a mood, and forcing them to be identical
 * would mean losing labels like "Motivated" or "Romantic" that are more
 * natural for a manual pick than for a facial-expression classification.
 *
 * Each entry maps directly to search terms (kept deliberately simple - a
 * static lookup rather than routing through the full valence/arousal
 * machinery, since this is just picking a search query, not detecting
 * anything).
 */
export const QUICK_MOODS = [
  { key: 'Calm', emoji: '😌', searchTerms: ['calm acoustic chill'] },
  { key: 'Happy', emoji: '😊', searchTerms: ['feel good upbeat pop'] },
  { key: 'Sad', emoji: '😢', searchTerms: ['sad acoustic ballad'] },
  { key: 'Excited', emoji: '🤩', searchTerms: ['high energy dance pop'] },
  { key: 'Motivated', emoji: '💪', searchTerms: ['upbeat workout motivation'] },
  { key: 'Worried', emoji: '😟', searchTerms: ['calming ambient instrumental'] },
  { key: 'Anxious', emoji: '😰', searchTerms: ['calming ambient instrumental'] },
  { key: 'Romantic', emoji: '😍', searchTerms: ['romantic love songs'] },
];

export function getQuickMood(key) {
  return QUICK_MOODS.find((m) => m.key === key) || QUICK_MOODS[0];
}
