import { MOOD_WEIGHTS, RECOMMENDATION_WEIGHTS, PRIMARY_MOODS, CALIBRATION_LABELS } from '../moodTypes';

const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

test('MOOD_WEIGHTS sums to 1', () => {
  expect(sum(MOOD_WEIGHTS)).toBeCloseTo(1);
});

test('RECOMMENDATION_WEIGHTS sums to 1', () => {
  expect(sum(RECOMMENDATION_WEIGHTS)).toBeCloseTo(1);
});

test('PRIMARY_MOODS includes uncertain as a valid, non-fabricated outcome', () => {
  expect(PRIMARY_MOODS).toContain('uncertain');
});

test('CALIBRATION_LABELS includes Neutral, the one calibration actually depends on', () => {
  expect(CALIBRATION_LABELS).toContain('Neutral');
});
