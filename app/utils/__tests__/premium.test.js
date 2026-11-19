jest.mock('../../services/playlistService', () => ({ playlistService: {} }));
jest.mock('../../services/supabaseService', () => ({ supabaseService: {} }));

import { getPlanPrice, PLANS } from '../plans';
import { computeInsights } from '../moodInsights';
import { buildSearchTerms } from '../moodMusic';

describe('premium helpers', () => {
  it('applies the yearly discount', () => {
    const premium = PLANS.find((plan) => plan.id === 'premium');
    const yearly = getPlanPrice(premium, 'yearly');
    expect(yearly).toBeCloseTo(premium.monthly * 12 * 0.8, 1);
  });

  it('handles empty history', () => {
    const result = computeInsights([], 30);
    expect(result.total).toBe(0);
    expect(result.weekly).toHaveLength(7);
  });

  it('counts moods', () => {
    const now = new Date();
    const history = [
      { mood_label: 'happy', created_at: now.toISOString(), playback_seconds: 120 },
      { mood_label: 'happy', created_at: now.toISOString(), playback_seconds: 60 },
      { mood_label: 'sad', created_at: now.toISOString(), playback_seconds: 0 },
    ];
    const result = computeInsights(history, 7, now);
    expect(result.total).toBe(3);
    expect(result.topMood.label.toLowerCase()).toContain('happy');
    expect(result.minutesListened).toBe(3);
  });

  it('builds search terms', () => {
    const terms = buildSearchTerms('happy', null);
    expect(terms.length).toBeGreaterThan(0);
  });
});
