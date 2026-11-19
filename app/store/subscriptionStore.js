import { create } from 'zustand';
import { supabaseService } from '../services/supabaseService';
import { PAID_PLAN_NAMES, addDays, getBillingPeriodDays } from '../utils/plans';

const FREE_STATE = {
  subscription: null,
  currentPlan: 'Free',
  subscriptionEndDate: null,
  isActive: false,
};

export const useSubscriptionStore = create((set) => ({
  subscription: null,
  isLoading: false,
  error: null,
  paymentHistory: [],
  currentPlan: 'Free',
  subscriptionEndDate: null,
  isActive: false,

  setSubscription: (subscription) => set({ subscription }),

  setCurrentPlan: (plan) => set({ currentPlan: plan }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  upgradeSubscription: (plan, details = {}) =>
    set((state) => ({
      subscription: {
        ...state.subscription,
        ...details,
        plan,
        upgradedAt: new Date().toISOString(),
      },
      currentPlan: plan,
      subscriptionEndDate: details.nextBillingDate || state.subscriptionEndDate,
      isActive: true,
    })),

  addPaymentHistory: (payment) =>
    set((state) => ({
      paymentHistory: [payment, ...state.paymentHistory],
    })),

  setPaymentHistory: (history) => set({ paymentHistory: history }),

  getSubscriptionStatus: () => {
    const state = useSubscriptionStore.getState();
    return state.subscription ? state.subscription.plan : 'Free';
  },

  isSubscriptionActive: () => {
    const state = useSubscriptionStore.getState();
    return state.isActive && state.subscription !== null;
  },

  cancelSubscription: () =>
    set((state) => ({
      subscription: state.subscription
        ? {
            ...state.subscription,
            isActive: false,
            cancelledAt: new Date().toISOString(),
          }
        : null,
      currentPlan: 'Free',
      subscriptionEndDate: null,
      isActive: false,
    })),

  renewSubscription: (plan) =>
    set((state) => ({
      subscription: {
        ...state.subscription,
        plan,
        renewedAt: new Date().toISOString(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      currentPlan: plan,
      isActive: true,
    })),

  setSubscriptionEndDate: (date) => set({ subscriptionEndDate: date }),

  getPaymentHistory: () => {
    const state = useSubscriptionStore.getState();
    return state.paymentHistory;
  },

  clearSubscription: () =>
    set({
      ...FREE_STATE,
      paymentHistory: [],
    }),

  loadSubscription: async (userId) => {
    if (!userId) {
      set({ ...FREE_STATE, paymentHistory: [] });
      return;
    }

    try {
      set({ isLoading: true });

      const result = await supabaseService.subscriptions.getSubscriptionByUser(userId);

      if (!result.success) {
        return;
      }

      const record = result.data;

      if (record && record.is_active && PAID_PLAN_NAMES.includes(record.plan_name)) {
        const startDate = record.start_date || record.created_at || new Date().toISOString();
        const nextBillingDate = addDays(
          startDate,
          getBillingPeriodDays(record.plan_duration)
        ).toISOString();

        set({
          subscription: {
            id: record.id,
            plan: record.plan_name,
            duration: record.plan_duration,
            price: record.plan_price,
            startDate,
            nextBillingDate,
          },
          currentPlan: record.plan_name,
          subscriptionEndDate: nextBillingDate,
          isActive: true,
        });
      } else {
        set({ ...FREE_STATE });
      }
    } catch (error) {
      console.log('Subscription load error:', error?.message || error);
    } finally {
      set({ isLoading: false });
    }
  },

  hasFeature: (feature) => {
    const state = useSubscriptionStore.getState();
    const plan = state.isActive ? state.currentPlan : 'Free';

    const free = ['basicMoodTracking', 'moodSuggestions'];
    const premium = [
      ...free,
      'moodInsights',
      'moodMixPlus',
      'premiumCollections',
    ];

    const features = {
      Free: free,
      Premium: premium,
      Family: [...premium, 'familySharing'],
    };

    return Boolean(features[plan] && features[plan].includes(feature));
  },
}));

export const selectIsPremium = (state) =>
  state.isActive && PAID_PLAN_NAMES.includes(state.currentPlan);
