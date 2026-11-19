import { GOOGLE_VISION_API_KEY } from '../utils/constants';

const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

const LIKELIHOOD_SCORE = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 0.05,
  UNLIKELY: 0.2,
  POSSIBLE: 0.5,
  LIKELY: 0.75,
  VERY_LIKELY: 0.95,
};

export const visionService = {
  analyzeFacePhoto: async (base64Image) => {
    try {
      console.log('VISION: sending request, base64 length:', base64Image?.length);

      const response = await fetch(VISION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: 'FACE_DETECTION', maxResults: 1 }],
            },
          ],
        }),
      });

      const data = await response.json();
      console.log('VISION: raw response:', JSON.stringify(data, null, 2));

      if (data.responses?.[0]?.error) {
        console.log('VISION: API returned error:', data.responses[0].error);
        return { success: false, error: data.responses[0].error.message };
      }

      const face = data.responses?.[0]?.faceAnnotations?.[0];

      if (!face) {
        console.log('VISION: no face annotation found in response');
        return { success: false, error: 'No face detected. Try again with better lighting.' };
      }

      const happy = LIKELIHOOD_SCORE[face.joyLikelihood] || 0;
      const sad = LIKELIHOOD_SCORE[face.sorrowLikelihood] || 0;
      const angry = LIKELIHOOD_SCORE[face.angerLikelihood] || 0;
      const surprised = LIKELIHOOD_SCORE[face.surpriseLikelihood] || 0;
      const neutral = Math.max(0, 1 - Math.max(happy, sad, angry, surprised));

      return {
        success: true,
        faceData: {
          emotions: { happy, sad, angry, neutral, surprised },
        },
      };
    } catch (error) {
      console.log('VISION: threw error:', error);
      return { success: false, error: error.message || 'Failed to analyze photo' };
    }
  },

  /**
   * Richer face-detection call used by app/services/mood/facialEmotionService.js.
   * Unlike analyzeFacePhoto (maxResults: 1, emotions only), this asks Vision
   * for up to 5 faces and returns everything the quality-gating logic needs:
   * bounding box (for face-size/out-of-frame checks), blur/exposure
   * likelihoods, head-pose angles, and the API's own detection confidence.
   *
   * Contract:
   *  - success:false only for an actual request/API failure.
   *  - success:true, faceCount:0, faces:[] is a normal "no face found" result
   *    (not an error) - facialEmotionService.js checks faceCount separately.
   */
  analyzeFacePhotoDetailed: async (base64Image) => {
    try {
      const response = await fetch(VISION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: 'FACE_DETECTION', maxResults: 5 }],
            },
          ],
        }),
      });

      if (!response.ok) {
        return { success: false, error: `Vision API request failed (${response.status})` };
      }

      const data = await response.json();

      if (data.responses?.[0]?.error) {
        return { success: false, error: data.responses[0].error.message };
      }

      const annotations = data.responses?.[0]?.faceAnnotations || [];
      const faces = annotations.map(mapDetailedFaceAnnotation);

      return { success: true, faceCount: faces.length, faces };
    } catch (error) {
      console.log('VISION (detailed): threw error:', error);
      return { success: false, error: error.message || 'Failed to analyze photo' };
    }
  },
};

/** Bounding box in pixel coords from a Vision boundingPoly/fdBoundingPoly. */
function boundingBoxFromPoly(poly) {
  if (!poly?.vertices?.length) return null;
  const xs = poly.vertices.map((v) => v.x || 0);
  const ys = poly.vertices.map((v) => v.y || 0);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(...xs) - x;
  const height = Math.max(...ys) - y;
  return { x, y, width, height };
}

/** One Vision faceAnnotation -> the shape facialEmotionService.js expects. */
function mapDetailedFaceAnnotation(face) {
  // fdBoundingPoly is the tighter, skin-only face box; prefer it over the
  // looser boundingPoly (which can include hair/shoulders) for area checks.
  const boundingBox =
    boundingBoxFromPoly(face.fdBoundingPoly) ||
    boundingBoxFromPoly(face.boundingPoly) || { x: 0, y: 0, width: 0, height: 0 };

  const happy = LIKELIHOOD_SCORE[face.joyLikelihood] || 0;
  const sad = LIKELIHOOD_SCORE[face.sorrowLikelihood] || 0;
  const angry = LIKELIHOOD_SCORE[face.angerLikelihood] || 0;
  const surprised = LIKELIHOOD_SCORE[face.surpriseLikelihood] || 0;
  const neutral = Math.max(0, 1 - Math.max(happy, sad, angry, surprised));

  return {
    area: boundingBox.width * boundingBox.height,
    boundingBox,
    blurredLikelihood: LIKELIHOOD_SCORE[face.blurredLikelihood] || 0,
    underExposedLikelihood: LIKELIHOOD_SCORE[face.underExposedLikelihood] || 0,
    panAngle: typeof face.panAngle === 'number' ? face.panAngle : 0,
    tiltAngle: typeof face.tiltAngle === 'number' ? face.tiltAngle : 0,
    detectionConfidence:
      typeof face.detectionConfidence === 'number' ? face.detectionConfidence : 0,
    emotions: { happy, sad, angry, surprised, neutral },
  };
}