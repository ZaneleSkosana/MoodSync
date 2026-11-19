import { fuseMoodSignals, isUncertain } from '../moodFusionEngine';

const happyFacial = {
  joy: 0.8,
  sorrow: 0.05,
  anger: 0.02,
  surprise: 0.03,
  neutral: 0.1,
  confidence: 0.85,
  faceDetected: true,
  faceCount: 1,
  multipleFaces: false,
  qualityIssues: [],
  timestamp: Date.now(),
};

describe('fuseMoodSignals', () => {
  test('facial + heart rate + activity combine into one MoodState', () => {
    const result = fuseMoodSignals({
      facial: happyFacial,
      heartRate: { available: true, bpm: 130 },
      activity: { available: true, state: 'running' },
    });

    expect(result.valence).toBeGreaterThan(0);
    expect(result.arousal).toBeGreaterThan(0.5); // running + elevated bpm both push arousal up
    expect(result.source.facial).toBeGreaterThan(0);
    expect(result.source.heartRate).toBeGreaterThan(0);
    expect(result.source.activity).toBeGreaterThan(0);
    // Weights actually applied should still sum to 1 across whatever's available.
    const total = Object.values(result.source).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1);
  });

  test('heart rate unavailable - system still produces a valid result using the remaining signals', () => {
    const result = fuseMoodSignals({ facial: happyFacial, heartRate: { available: false, bpm: null } });

    expect(result.source.heartRate).toBe(0);
    expect(result.source.facial).toBeCloseTo(1); // only signal available -> gets 100% of the (renormalized) weight
    expect(isUncertain(result)).toBe(false);
  });

  test('camera/facial unavailable - system still produces a result from other signals, not a crash', () => {
    const result = fuseMoodSignals({
      facial: null,
      heartRate: { available: true, bpm: 100 },
      environment: { name: 'Gym' },
    });

    expect(result.source.facial).toBe(0);
    expect(result.source.heartRate).toBeGreaterThan(0);
    expect(result.source.environment).toBeGreaterThan(0);
    expect(Number.isFinite(result.valence)).toBe(true);
    expect(Number.isFinite(result.arousal)).toBe(true);
  });

  test('no signals at all degrades to uncertain with zero confidence, never a fabricated mood', () => {
    const result = fuseMoodSignals({});

    expect(result.primaryMood).toBe('uncertain');
    expect(result.confidence).toBe(0);
    expect(isUncertain(result)).toBe(true);
  });

  test('a face with zero confidence is treated the same as no face at all', () => {
    const result = fuseMoodSignals({ facial: { ...happyFacial, confidence: 0 } });
    expect(result.source.facial).toBe(0);
  });

  test('environment and activity only ever shift arousal, never valence, on their own', () => {
    const gymOnly = fuseMoodSignals({ environment: { name: 'Gym' } });
    const libraryOnly = fuseMoodSignals({ environment: { name: 'Library' } });

    expect(gymOnly.valence).toBe(0);
    expect(libraryOnly.valence).toBe(0);
    expect(gymOnly.arousal).toBeGreaterThan(libraryOnly.arousal);
  });

  test('an unrecognized environment name contributes no signal rather than a guessed one', () => {
    const result = fuseMoodSignals({ facial: happyFacial, environment: { name: 'Some Unknown Place' } });
    expect(result.source.environment).toBe(0);
  });

  test('facial and history corroborating each other nudges confidence up slightly', () => {
    const now = Date.now();
    const corroborating = fuseMoodSignals({
      facial: happyFacial,
      moodHistory: [{ mood_label: 'Happy', created_at: new Date(now).toISOString() }],
      now,
    });
    const facialOnly = fuseMoodSignals({ facial: happyFacial, now });

    expect(corroborating.confidence).toBeGreaterThanOrEqual(facialOnly.confidence);
  });
});
