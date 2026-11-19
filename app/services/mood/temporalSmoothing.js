/**
 * Lightweight temporal smoothing for facial emotion samples.
 *
 * Spec requirement: don't determine mood from a single camera frame. Collect
 * a handful of observations over ~3-5 seconds and smooth them rather than
 * trusting any one frame.
 *
 * We use an exponential moving average (EMA) rather than a simple mean
 * because it's O(1) memory/CPU per sample (important on a phone) and it
 * naturally weights more recent samples slightly higher, which helps if the
 * user's expression settles partway through the capture window.
 *
 * No React Native imports - pure logic, unit-testable with plain Node.
 */

const EMOTION_KEYS = ['joy', 'sorrow', 'anger', 'surprise', 'neutral'];

export class EmotionSmoother {
  /**
   * @param {number} alpha 0..1, how much weight the newest sample gets.
   *   Lower = smoother/slower to react, higher = snappier/noisier.
   */
  constructor(alpha = 0.5) {
    this.alpha = alpha;
    /** @type {import('./moodTypes').FacialEmotionResult[]} */
    this.samples = [];
    this.smoothed = null;
  }

  reset() {
    this.samples = [];
    this.smoothed = null;
  }

  /**
   * @param {import('./moodTypes').FacialEmotionResult} sample
   * @returns {import('./moodTypes').FacialEmotionResult} the smoothed state so far
   */
  addSample(sample) {
    this.samples.push(sample);

    // Poor-quality samples (no face, heavy blur, etc.) still count toward
    // "how many frames did we try", but should not drag the emotion average
    // toward zero - they simply don't move the smoothed estimate.
    if (!sample.faceDetected || sample.confidence <= 0) {
      return this.smoothed || sample;
    }

    if (!this.smoothed) {
      this.smoothed = { ...sample };
      return this.smoothed;
    }

    const next = { ...this.smoothed };
    for (const key of EMOTION_KEYS) {
      next[key] = this.alpha * sample[key] + (1 - this.alpha) * this.smoothed[key];
    }
    // Confidence is smoothed too, but a run of consistent samples should be
    // able to push it up toward the best single sample seen, not just decay.
    next.confidence = Math.max(
      this.alpha * sample.confidence + (1 - this.alpha) * this.smoothed.confidence,
      Math.min(this.smoothed.confidence, sample.confidence)
    );
    next.faceDetected = true;
    next.faceCount = sample.faceCount;
    next.multipleFaces = sample.multipleFaces;
    next.qualityIssues = sample.qualityIssues;
    next.timestamp = sample.timestamp;

    this.smoothed = next;
    return this.smoothed;
  }

  /** How stable the collected samples are (spec: "Expression stable [check]"). */
  getStability() {
    const usable = this.samples.filter((s) => s.faceDetected && s.confidence > 0);
    if (usable.length < 2) return 0;

    // Variance of the dominant-emotion value across usable samples - low
    // variance = stable expression, high variance = still settling.
    const dominantValues = usable.map((s) =>
      Math.max(s.joy, s.sorrow, s.anger, s.surprise, s.neutral)
    );
    const mean = dominantValues.reduce((a, b) => a + b, 0) / dominantValues.length;
    const variance =
      dominantValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / dominantValues.length;

    // Map variance (typically small, 0..~0.1) onto a 0..1 stability score.
    return Math.max(0, Math.min(1, 1 - variance * 8));
  }

  getSampleCount() {
    return this.samples.length;
  }

  getUsableSampleCount() {
    return this.samples.filter((s) => s.faceDetected && s.confidence > 0).length;
  }
}
