import {
  normalizeEmotions,
  emotionsToValenceArousal,
  classifyPrimaryMood,
  facialToMoodEstimate,
} from '../valenceArousal';

describe('normalizeEmotions', () => {
  test('normalizes to sum to 1', () => {
    const result = normalizeEmotions({ joy: 2, sorrow: 2, anger: 0, surprise: 0, neutral: 6 });
    const total = Object.values(result).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1);
    expect(result.joy).toBeCloseTo(0.2);
  });

  test('an all-zero input does not divide by zero', () => {
    const result = normalizeEmotions({ joy: 0, sorrow: 0, anger: 0, surprise: 0, neutral: 0 });
    expect(Object.values(result).every((v) => Number.isFinite(v))).toBe(true);
  });
});

describe('emotionsToValenceArousal', () => {
  test('joy-dominant input produces positive valence', () => {
    const { valence } = emotionsToValenceArousal({ joy: 0.9, sorrow: 0, anger: 0, surprise: 0, neutral: 0.1 });
    expect(valence).toBeGreaterThan(0.3);
  });

  test('sorrow-dominant input produces negative valence', () => {
    const { valence } = emotionsToValenceArousal({ joy: 0, sorrow: 0.9, anger: 0, surprise: 0, neutral: 0.1 });
    expect(valence).toBeLessThan(-0.3);
  });

  test('anger-dominant input produces negative valence and high arousal', () => {
    const { valence, arousal } = emotionsToValenceArousal({ joy: 0, sorrow: 0, anger: 0.9, surprise: 0, neutral: 0.1 });
    expect(valence).toBeLessThan(0);
    expect(arousal).toBeGreaterThan(0.6);
  });
});

describe('classifyPrimaryMood', () => {
  test('low confidence always classifies as uncertain, regardless of valence/arousal', () => {
    expect(classifyPrimaryMood(0.9, 0.9, 0.1)).toBe('uncertain');
    expect(classifyPrimaryMood(-0.9, 0.1, 0.34)).toBe('uncertain');
  });

  test('positive valence maps to calm/happy/excited as arousal rises', () => {
    expect(classifyPrimaryMood(0.5, 0.1, 1)).toBe('calm');
    expect(classifyPrimaryMood(0.5, 0.45, 1)).toBe('happy');
    expect(classifyPrimaryMood(0.5, 0.9, 1)).toBe('excited');
  });

  test('negative valence + low arousal is sad', () => {
    expect(classifyPrimaryMood(-0.5, 0.1, 1)).toBe('sad');
  });

  test('negative valence + higher arousal disambiguates angry vs. anxious using the raw emotion signal', () => {
    const angryDominant = { joy: 0, sorrow: 0, anger: 0.8, surprise: 0.05, neutral: 0.15 };
    const surpriseDominant = { joy: 0, sorrow: 0, anger: 0.05, surprise: 0.8, neutral: 0.15 };

    expect(classifyPrimaryMood(-0.5, 0.7, 1, angryDominant)).toBe('angry');
    expect(classifyPrimaryMood(-0.5, 0.7, 1, surpriseDominant)).toBe('anxious');
  });

  test('near-neutral valence with high arousal leans anxious/angry rather than happy or sad', () => {
    const surpriseDominant = { joy: 0, sorrow: 0, anger: 0.05, surprise: 0.8, neutral: 0.15 };
    expect(classifyPrimaryMood(0, 0.8, 1, surpriseDominant)).toBe('anxious');
  });

  test('near-neutral valence and arousal is neutral', () => {
    expect(classifyPrimaryMood(0, 0.2, 1)).toBe('neutral');
  });
});

describe('facialToMoodEstimate', () => {
  test('wraps the full pipeline from raw emotions to a primary mood', () => {
    const estimate = facialToMoodEstimate({
      joy: 0.85,
      sorrow: 0.02,
      anger: 0.02,
      surprise: 0.03,
      neutral: 0.08,
      confidence: 0.9,
    });

    expect(estimate.valence).toBeGreaterThan(0);
    expect(['happy', 'excited', 'calm']).toContain(estimate.primaryMood);
    expect(estimate.confidence).toBe(0.9);
  });
});
