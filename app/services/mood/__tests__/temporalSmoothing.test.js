import { EmotionSmoother } from '../temporalSmoothing';

function happySample(overrides = {}) {
  return {
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
    ...overrides,
  };
}

describe('EmotionSmoother', () => {
  test('a consistent run of samples produces a stable, high-confidence result', () => {
    const smoother = new EmotionSmoother(0.5);
    for (let i = 0; i < 5; i += 1) smoother.addSample(happySample());

    expect(smoother.smoothed.faceDetected).toBe(true);
    expect(smoother.smoothed.joy).toBeCloseTo(0.8, 1);
    expect(smoother.getStability()).toBeGreaterThan(0.8);
    expect(smoother.getUsableSampleCount()).toBe(5);
  });

  test('a run of samples alternating between a strongly peaked expression and a flat, ambiguous one produces low stability', () => {
    const smoother = new EmotionSmoother(0.5);
    // getStability() measures variance in the *magnitude* of whichever
    // emotion is dominant each frame - so "erratic" here means the peak
    // strength swinging around, not which emotion happens to be on top.
    smoother.addSample(happySample({ joy: 0.9, sorrow: 0.02, anger: 0.02, surprise: 0.02, neutral: 0.04 }));
    smoother.addSample(happySample({ joy: 0.2, sorrow: 0.2, anger: 0.2, surprise: 0.2, neutral: 0.2 }));
    smoother.addSample(happySample({ joy: 0.9, sorrow: 0.02, anger: 0.02, surprise: 0.02, neutral: 0.04 }));

    expect(smoother.getStability()).toBeLessThan(0.5);
  });

  test('poor-quality (no-face) samples count toward the total but not the usable count, and do not drag the average toward zero', () => {
    const smoother = new EmotionSmoother(0.5);
    smoother.addSample(happySample());
    smoother.addSample({
      joy: 0,
      sorrow: 0,
      anger: 0,
      surprise: 0,
      neutral: 1,
      confidence: 0,
      faceDetected: false,
      faceCount: 0,
      multipleFaces: false,
      qualityIssues: ['no_face'],
      timestamp: Date.now(),
    });
    smoother.addSample(happySample());

    expect(smoother.getSampleCount()).toBe(3);
    expect(smoother.getUsableSampleCount()).toBe(2);
    // The no-face frame shouldn't have pulled joy down toward 0.
    expect(smoother.smoothed.joy).toBeGreaterThan(0.5);
  });

  test('with zero usable samples, smoothed stays null and stability is 0', () => {
    const smoother = new EmotionSmoother();
    smoother.addSample({ faceDetected: false, confidence: 0, joy: 0, sorrow: 0, anger: 0, surprise: 0, neutral: 1 });

    expect(smoother.smoothed).toBeNull();
    expect(smoother.getStability()).toBe(0);
    expect(smoother.getUsableSampleCount()).toBe(0);
  });

  test('reset() clears accumulated state', () => {
    const smoother = new EmotionSmoother();
    smoother.addSample(happySample());
    smoother.reset();

    expect(smoother.smoothed).toBeNull();
    expect(smoother.getSampleCount()).toBe(0);
  });
});
