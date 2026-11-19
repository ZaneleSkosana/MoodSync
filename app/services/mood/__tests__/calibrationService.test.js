import {
  averageSamples,
  applyCalibration,
  saveBaseline,
  getCalibration,
  hasCalibration,
  clearCalibration,
} from '../calibrationService';

describe('averageSamples', () => {
  test('averages only face-detected samples', () => {
    const samples = [
      { faceDetected: true, joy: 0.2, sorrow: 0.1, anger: 0, surprise: 0, neutral: 0.7 },
      { faceDetected: false, joy: 0.9, sorrow: 0, anger: 0, surprise: 0, neutral: 0.1 },
      { faceDetected: true, joy: 0.0, sorrow: 0.1, anger: 0, surprise: 0, neutral: 0.9 },
    ];
    const baseline = averageSamples(samples);
    expect(baseline.sampleCount).toBe(2);
    expect(baseline.joy).toBeCloseTo(0.1);
  });

  test('returns null when there are no usable samples', () => {
    expect(averageSamples([{ faceDetected: false }])).toBeNull();
    expect(averageSamples([])).toBeNull();
  });
});

describe('applyCalibration', () => {
  const neutralBaseline = { joy: 0.1, sorrow: 0.15, anger: 0.02, surprise: 0.02, neutral: 0.71 };

  test('passthrough when there is no stored calibration', () => {
    const facial = { faceDetected: true, joy: 0.5, sorrow: 0.1, anger: 0, surprise: 0, neutral: 0.4, confidence: 0.8 };
    expect(applyCalibration(facial, null)).toBe(facial);
    expect(applyCalibration(facial, {})).toBe(facial);
  });

  test('subtracts the user\'s resting-face bias from a live reading', () => {
    const facial = { faceDetected: true, joy: 0.15, sorrow: 0.2, anger: 0.05, surprise: 0.02, neutral: 0.58, confidence: 0.8 };
    const corrected = applyCalibration(facial, { Neutral: neutralBaseline });

    expect(corrected.sorrow).toBeCloseTo(facial.sorrow - neutralBaseline.sorrow, 5);
    expect(corrected.joy).toBeCloseTo(facial.joy - neutralBaseline.joy, 5);
  });

  test('never returns a negative value even if the bias exceeds the raw reading', () => {
    const facial = { faceDetected: true, joy: 0.02, sorrow: 0.05, anger: 0, surprise: 0, neutral: 0.93, confidence: 0.8 };
    const corrected = applyCalibration(facial, { Neutral: neutralBaseline });
    expect(corrected.joy).toBeGreaterThanOrEqual(0);
  });

  test('does nothing to a sample where no face was detected', () => {
    const facial = { faceDetected: false, joy: 0, sorrow: 0, anger: 0, surprise: 0, neutral: 1, confidence: 0 };
    expect(applyCalibration(facial, { Neutral: neutralBaseline })).toBe(facial);
  });

  test('gives a small confidence boost when a reading closely matches a posed non-neutral baseline', () => {
    const happyBaseline = { joy: 0.85, sorrow: 0.02, anger: 0.01, surprise: 0.02, neutral: 0.1 };
    const closeToHappy = { faceDetected: true, joy: 0.86, sorrow: 0.02, anger: 0.01, surprise: 0.01, neutral: 0.1, confidence: 0.7 };

    const corrected = applyCalibration(closeToHappy, { Neutral: neutralBaseline, Happy: happyBaseline });
    expect(corrected.confidence).toBeGreaterThan(0.7);
  });
});

describe('persistence round-trip', () => {
  const userId = 'test-user';

  beforeEach(async () => {
    await clearCalibration(userId);
  });

  test('saving a baseline makes it retrievable, and hasCalibration reflects Neutral specifically', async () => {
    expect(await hasCalibration(userId)).toBe(false);

    const samples = [
      { faceDetected: true, joy: 0.1, sorrow: 0.1, anger: 0, surprise: 0, neutral: 0.8 },
      { faceDetected: true, joy: 0.12, sorrow: 0.08, anger: 0, surprise: 0, neutral: 0.8 },
    ];
    const result = await saveBaseline(userId, 'Neutral', samples);
    expect(result.success).toBe(true);

    expect(await hasCalibration(userId)).toBe(true);
    const stored = await getCalibration(userId);
    expect(stored.Neutral.sampleCount).toBe(2);
  });

  test('saving with no usable samples fails clearly instead of storing garbage', async () => {
    const result = await saveBaseline(userId, 'Happy', [{ faceDetected: false }]);
    expect(result.success).toBe(false);
  });

  test('rejects an unrecognized label', async () => {
    await expect(saveBaseline(userId, 'NotARealLabel', [])).rejects.toThrow();
  });

  test('clearCalibration removes stored data', async () => {
    await saveBaseline(userId, 'Neutral', [{ faceDetected: true, joy: 0.1, sorrow: 0.1, anger: 0, surprise: 0, neutral: 0.8 }]);
    await clearCalibration(userId);
    expect(await getCalibration(userId)).toBeNull();
  });
});
