jest.mock('../../visionService', () => ({
  visionService: {
    analyzeFacePhotoDetailed: jest.fn(),
  },
}));

import { visionService } from '../../visionService';
import { analyzeFacialEmotion, guidanceForQualityIssues } from '../facialEmotionService';

/** Builds a visionService.analyzeFacePhotoDetailed-shaped response with one face. */
function mockFaceResult(overrides = {}) {
  return {
    success: true,
    faceCount: 1,
    faces: [
      {
        area: 40000, // e.g. a 200x200 box
        boundingBox: { x: 100, y: 100, width: 200, height: 200 },
        blurredLikelihood: 0.1,
        underExposedLikelihood: 0.1,
        panAngle: 0,
        tiltAngle: 0,
        detectionConfidence: 0.9,
        emotions: { happy: 0.1, sad: 0.1, angry: 0.05, surprised: 0.05, neutral: 0.7 },
        ...overrides,
      },
    ],
  };
}

beforeEach(() => {
  visionService.analyzeFacePhotoDetailed.mockReset();
});

describe('analyzeFacialEmotion', () => {
  test('happy-dominant input produces high joy and full confidence, no quality issues', async () => {
    visionService.analyzeFacePhotoDetailed.mockResolvedValue(
      mockFaceResult({ emotions: { happy: 0.85, sad: 0.02, angry: 0.02, surprised: 0.03, neutral: 0.08 } })
    );

    const result = await analyzeFacialEmotion('base64', { width: 1000, height: 1000 });

    expect(result.faceDetected).toBe(true);
    expect(result.joy).toBeCloseTo(0.85);
    expect(result.qualityIssues).toEqual([]);
    expect(result.confidence).toBeCloseTo(0.9); // no penalties applied
  });

  test('sorrow-dominant input produces high sorrow', async () => {
    visionService.analyzeFacePhotoDetailed.mockResolvedValue(
      mockFaceResult({ emotions: { happy: 0.02, sad: 0.8, angry: 0.05, surprised: 0.03, neutral: 0.1 } })
    );

    const result = await analyzeFacialEmotion('base64', { width: 1000, height: 1000 });

    expect(result.sorrow).toBeCloseTo(0.8);
    expect(result.joy).toBeLessThan(result.sorrow);
  });

  test('no face detected returns an empty, zero-confidence result rather than guessing', async () => {
    visionService.analyzeFacePhotoDetailed.mockResolvedValue({ success: true, faceCount: 0, faces: [] });

    const result = await analyzeFacialEmotion('base64', { width: 1000, height: 1000 });

    expect(result.faceDetected).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.qualityIssues).toEqual(['no_face']);
  });

  test('a failed Vision API call degrades to "detection_failed" instead of throwing', async () => {
    visionService.analyzeFacePhotoDetailed.mockResolvedValue({ success: false });

    const result = await analyzeFacialEmotion('base64', { width: 1000, height: 1000 });

    expect(result.faceDetected).toBe(false);
    expect(result.qualityIssues).toEqual(['detection_failed']);
  });

  test('a face occupying too little of the frame is flagged and penalized', async () => {
    visionService.analyzeFacePhotoDetailed.mockResolvedValue(
      mockFaceResult({ area: 100, boundingBox: { x: 500, y: 500, width: 10, height: 10 } })
    );

    const result = await analyzeFacialEmotion('base64', { width: 1000, height: 1000 });

    expect(result.qualityIssues).toContain('face_too_small');
    expect(result.confidence).toBeLessThan(0.9);
  });

  test('a blurry frame is flagged and confidence is reduced accordingly', async () => {
    visionService.analyzeFacePhotoDetailed.mockResolvedValue(
      mockFaceResult({ blurredLikelihood: 0.9 })
    );

    const result = await analyzeFacialEmotion('base64', { width: 1000, height: 1000 });

    expect(result.qualityIssues).toContain('blurry');
    expect(result.confidence).toBeCloseTo(0.6); // 0.9 base - 0.3 blur penalty
  });

  test('two comparably-sized faces are flagged as ambiguous, not silently resolved', async () => {
    const result = mockFaceResult();
    result.faceCount = 2;
    result.faces.push({ ...result.faces[0], area: 38000 }); // within 60% of primary

    visionService.analyzeFacePhotoDetailed.mockResolvedValue(result);

    const analyzed = await analyzeFacialEmotion('base64', { width: 1000, height: 1000 });

    expect(analyzed.multipleFaces).toBe(true);
    expect(analyzed.qualityIssues).toContain('ambiguous_multiple_faces');
  });

  test('the largest face is used as the primary subject among multiple faces', async () => {
    const small = mockFaceResult({ emotions: { happy: 0.9, sad: 0, angry: 0, surprised: 0, neutral: 0.1 }, area: 5000 }).faces[0];
    const large = mockFaceResult({ emotions: { happy: 0, sad: 0.9, angry: 0, surprised: 0, neutral: 0.1 }, area: 40000 }).faces[0];

    visionService.analyzeFacePhotoDetailed.mockResolvedValue({
      success: true,
      faceCount: 2,
      faces: [small, large], // primary listed first in the raw API response...
    });

    const result = await analyzeFacialEmotion('base64', { width: 1000, height: 1000 });

    // ...but the larger face should still win, not "whichever came first".
    expect(result.sorrow).toBeCloseTo(0.9);
  });
});

describe('guidanceForQualityIssues', () => {
  test('gives specific, actionable tips per issue', () => {
    expect(guidanceForQualityIssues(['no_face'])[0]).toMatch(/face is visible/i);
    expect(guidanceForQualityIssues(['blurry'])[0]).toMatch(/hold still/i);
    expect(guidanceForQualityIssues(['poor_lighting'])[0]).toMatch(/lighting/i);
  });

  test('falls back to generic guidance when there are no specific issues', () => {
    expect(guidanceForQualityIssues([])).toEqual(['Hold still and face the camera']);
  });
});
