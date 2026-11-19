import { classifyMotion } from '../activityService';

describe('classifyMotion', () => {
  test('near-zero variance is stationary', () => {
    expect(classifyMotion(0.01)).toBe('stationary');
  });

  test('moderate variance is walking', () => {
    expect(classifyMotion(0.1)).toBe('walking');
  });

  test('high variance is running', () => {
    expect(classifyMotion(0.4)).toBe('running');
  });

  test('fast GPS speed with low accelerometer variance is a vehicle, not stationary', () => {
    expect(classifyMotion(0.02, 8)).toBe('vehicle');
  });

  test('fast GPS speed with high variance is still running (e.g. running downhill), not misclassified as a vehicle', () => {
    expect(classifyMotion(0.4, 8)).toBe('running');
  });

  test('no GPS speed available falls back to accelerometer-only classification', () => {
    expect(classifyMotion(0.01, null)).toBe('stationary');
  });
});
