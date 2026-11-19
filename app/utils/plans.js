export const CURRENCY_SYMBOL = 'R';
export const YEARLY_DISCOUNT = 0.2;
export const SIMULATED_PAYMENTS = true;
export const FREE_SUGGESTION_LIMIT = 10;
export const PREMIUM_SUGGESTION_LIMIT = 25;

export const PAID_PLAN_NAMES = ['Premium', 'Family'];

export const PREMIUM_FEATURES = [
  {
    id: 'insights',
    icon: '📊',
    title: 'Mood Insights',
    description:
      'See your mood patterns, daily streaks, favourite times of day and listening time in one dashboard.',
    status: 'live',
    target: { screen: 'MoodInsights' },
  },
  {
    id: 'mixplus',
    icon: '🎧',
    title: 'Mood Mix Plus',
    description:
      'Get 25 song suggestions for every emoji instead of 10, with fresh picks whenever you want them.',
    status: 'live',
    target: { tab: 'Home', screen: 'MoodSelection' },
  },
  {
    id: 'collections',
    icon: '🎼',
    title: 'Premium Collections',
    description:
      'Curated Deep Focus, Sleep, Workout, Road Trip and more, ready to play in full.',
    status: 'live',
    target: { screen: 'PremiumCollections' },
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧‍👦',
    title: 'Family Sharing',
    description: 'Share Premium with up to 6 people in your household.',
    status: 'soon',
    planOnly: 'Family',
    target: null,
  },
];

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Get started with MoodSync',
    monthly: 0,
    popular: false,
    features: [
      'Mood detection and emoji mood picks',
      `${FREE_SUGGESTION_LIMIT} song suggestions per mood`,
      'Full-length song streaming',
      'Mood history and playlists',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'The complete MoodSync experience',
    monthly: 49.99,
    popular: true,
    features: [
      'Everything in Free',
      'Mood Insights dashboard',
      `Mood Mix Plus: ${PREMIUM_SUGGESTION_LIMIT} suggestions and fresh picks`,
      'Premium Collections for focus, sleep and workouts',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    tagline: 'Premium for the whole household',
    monthly: 79.99,
    popular: false,
    features: [
      'Everything in Premium',
      'Share with up to 6 people (coming soon)',
      'One bill for the household',
    ],
  },
];

export const COMPARISON_ROWS = [
  { label: 'Emoji mood suggestions', free: true, premium: true, family: true },
  { label: 'Full-length streaming', free: true, premium: true, family: true },
  { label: 'Songs per mood', free: String(FREE_SUGGESTION_LIMIT), premium: String(PREMIUM_SUGGESTION_LIMIT), family: String(PREMIUM_SUGGESTION_LIMIT) },
  { label: 'Fresh picks', free: false, premium: true, family: true },
  { label: 'Mood Insights', free: false, premium: true, family: true },
  { label: 'Premium Collections', free: false, premium: true, family: true },
  { label: 'Family sharing', free: false, premium: false, family: 'Soon' },
];

const roundMoney = (value) => Math.round(value * 100) / 100;

export const getPlanPrice = (plan, billing = 'monthly') => {
  if (!plan || !plan.monthly) {
    return 0;
  }

  if (billing === 'yearly') {
    return roundMoney(plan.monthly * 12 * (1 - YEARLY_DISCOUNT));
  }

  return roundMoney(plan.monthly);
};

export const formatMoney = (amount) =>
  `${CURRENCY_SYMBOL}${Number(amount || 0).toFixed(2)}`;

export const getBillingPeriodDays = (duration) =>
  String(duration || '').toLowerCase() === 'yearly' ? 365 : 30;

export const addDays = (date, days) =>
  new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);

export const formatLongDate = (date) => {
  try {
    return new Date(date).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (error) {
    return '';
  }
};

export const openPremiumFeature = (navigation, feature) => {
  if (!feature || !feature.target) {
    return;
  }

  const { tab, screen } = feature.target;

  if (tab) {
    navigation.navigate(tab, { screen });
    return;
  }

  navigation.navigate(screen);
};
