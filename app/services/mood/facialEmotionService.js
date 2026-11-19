/**
 * Turns a single captured photo into a quality-gated FacialEmotionResult.
 *
 * This wraps the existing Google Cloud Vision integration
 * (app/services/visionService.js) rather than replacing it - the original
 * `analyzeFacePhoto` is left untouched for backward compatibility, and this
 * file calls the new `analyzeFacePhotoDetailed` method added alongside it.
 *
 * Responsibilities specific to this file (spec section 3 & 6):
 *  - Never do `mood = highest likelihood emotion`. This returns normalized
 *    probabilities; the valence/arousal conversion happens in
 *    valenceArousal.js.
 *  - Reject/flag poor input instead of pretending confidence: no face,
 *    multiple faces, face too small, face partially out of frame, extreme
 *    head rotation, blur, poor lighting.
 *  - If multiple faces are detected, prefer the largest (most likely
 *    closest-to-camera / intended subject) and explicitly flag ambiguity
 *    when a second face is comparably sized, rather than silently picking
 *    whichever face the API listed first.
 */

import { visionService } from '../visionService';

const QUALITY_PENALTIES = {
  multiple_faces: 0.1,
  ambiguous_multiple_faces: 0.35,
  face_too_small: 0.3,
  face_partially_out_of_frame: 0.25,
  blurry: 0.3,
  poor_lighting: 0.25,
  extreme_head_rotation: 0.3,
};

const MIN_FACE_AREA_RATIO = 0.03; // face should occupy at least ~3% of the frame
const MAX_HEAD_ANGLE_DEGREES = 35;
const AMBIGUOUS_SIZE_RATIO = 0.6; // second face within 60% of primary's area

function emptyResult(qualityIssues, timestamp) {
  return {
    joy: 0,
    sorrow: 0,
    anger: 0,
    surprise: 0,
    neutral: 1,
    confidence: 0,
    faceDetected: false,
    faceCount: 0,
    multipleFaces: false,
    qualityIssues,
    timestamp,
  };
}

/**
 * @param {string} base64Image
 * @param {{ width?: number, height?: number }} [imageDimensions] the
 *   captured photo's pixel dimensions, used to judge face-too-small /
 *   partially-out-of-frame. Optional - those two checks are skipped if
 *   dimensions aren't supplied.
 * @returns {Promise<import('./moodTypes').FacialEmotionResult>}
 */
export async function analyzeFacialEmotion(base64Image, imageDimensions = {}) {
  const timestamp = Date.now();
  const result = await visionService.analyzeFacePhotoDetailed(base64Image);

  if (!result.success) {
    return emptyResult(['detection_failed'], timestamp);
  }

  if (!result.faceCount) {
    return emptyResult(['no_face'], timestamp);
  }

  const faces = [...result.faces].sort((a, b) => b.area - a.area);
  const primary = faces[0];
  const multipleFaces = faces.length > 1;
  const ambiguous = multipleFaces && faces[1].area > primary.area * AMBIGUOUS_SIZE_RATIO;

  const qualityIssues = [];
  if (multipleFaces) qualityIssues.push('multiple_faces');
  if (ambiguous) qualityIssues.push('ambiguous_multiple_faces');

  const { width, height } = imageDimensions;
  if (width && height && primary.area > 0) {
    const faceAreaRatio = primary.area / (width * height);
    if (faceAreaRatio < MIN_FACE_AREA_RATIO) {
      qualityIssues.push('face_too_small');
    }
    const box = primary.boundingBox;
    const touchesEdge =
      box.x <= 1 || box.y <= 1 || box.x + box.width >= width - 1 || box.y + box.height >= height - 1;
    if (touchesEdge) {
      qualityIssues.push('face_partially_out_of_frame');
    }
  }

  if (primary.blurredLikelihood >= 0.5) qualityIssues.push('blurry');
  if (primary.underExposedLikelihood >= 0.5) qualityIssues.push('poor_lighting');
  if (
    Math.abs(primary.panAngle) > MAX_HEAD_ANGLE_DEGREES ||
    Math.abs(primary.tiltAngle) > MAX_HEAD_ANGLE_DEGREES
  ) {
    qualityIssues.push('extreme_head_rotation');
  }

  const baseConfidence =
    typeof primary.detectionConfidence === 'number' && primary.detectionConfidence > 0
      ? primary.detectionConfidence
      : 0.6;

  const totalPenalty = qualityIssues.reduce(
    (sum, issue) => sum + (QUALITY_PENALTIES[issue] || 0),
    0
  );

  const confidence = Math.max(0, Math.min(1, baseConfidence - totalPenalty));

  return {
    joy: primary.emotions.happy,
    sorrow: primary.emotions.sad,
    anger: primary.emotions.angry,
    surprise: primary.emotions.surprised,
    neutral: primary.emotions.neutral,
    confidence,
    faceDetected: true,
    faceCount: faces.length,
    multipleFaces,
    qualityIssues,
    timestamp,
  };
}

/** Human-readable retry guidance for a set of quality issues (spec section 20). */
export function guidanceForQualityIssues(qualityIssues = []) {
  const tips = [];
  if (qualityIssues.includes('no_face')) tips.push('Make sure your face is visible in the frame');
  if (qualityIssues.includes('multiple_faces') || qualityIssues.includes('ambiguous_multiple_faces')) {
    tips.push('Try again with just yourself in frame');
  }
  if (qualityIssues.includes('face_too_small')) tips.push('Move a little closer to the camera');
  if (qualityIssues.includes('face_partially_out_of_frame')) tips.push('Center your face in the frame');
  if (qualityIssues.includes('blurry')) tips.push('Hold still for a moment');
  if (qualityIssues.includes('poor_lighting')) tips.push('Try somewhere with better lighting');
  if (qualityIssues.includes('extreme_head_rotation')) tips.push('Face the camera directly');
  if (qualityIssues.includes('detection_failed')) tips.push('Check your connection and try again');
  return tips.length ? tips : ['Hold still and face the camera'];
}
