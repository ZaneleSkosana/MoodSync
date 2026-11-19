import { COLORS } from './colors';
import { getMoodEmoji } from './helpers';

const MOOD_COLORS = {
  Happy: COLORS.moodHappy,
  Sad: COLORS.moodSad,
  Stressed: COLORS.moodStressed,
  Motivated: COLORS.moodMotivated,
  Calm: COLORS.moodCalm,
  Energetic: COLORS.moodEnergetic,
  Anxious: COLORS.moodAnxious,
  Excited: COLORS.moodExcited,
  Worried: COLORS.chart6,
  Romantic: COLORS.chart7,
  Angry: COLORS.chart4,
  Neutral: COLORS.gray400,
};

export const getMoodColor = (label) => MOOD_COLORS[label] || COLORS.primaryLight;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const dayKey = (date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

export const getTimeBucket = (date) => {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
};

const topEntry = (counts) => {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries.length ? { label: entries[0][0], count: entries[0][1] } : null;
};

export const computeInsights = (history, days = 30, now = new Date()) => {
  const safeHistory = Array.isArray(history) ? history : [];
  const cutoff = days ? now.getTime() - days * 24 * 60 * 60 * 1000 : 0;

  const entries = safeHistory
    .filter((entry) => entry && entry.mood_label && entry.created_at)
    .map((entry) => ({ ...entry, date: new Date(entry.created_at) }))
    .filter((entry) => !Number.isNaN(entry.date.getTime()))
    .filter((entry) => entry.date.getTime() >= cutoff);

  const total = entries.length;

  const moodCounts = {};
  const bucketCounts = {
    Morning: {},
    Afternoon: {},
    Evening: {},
    Night: {},
  };
  let secondsListened = 0;

  entries.forEach((entry) => {
    moodCounts[entry.mood_label] = (moodCounts[entry.mood_label] || 0) + 1;

    const bucket = getTimeBucket(entry.date);
    bucketCounts[bucket][entry.mood_label] =
      (bucketCounts[bucket][entry.mood_label] || 0) + 1;

    secondsListened += Number(entry.playback_seconds || 0);
  });

  const distribution = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      emoji: getMoodEmoji(label),
      color: getMoodColor(label),
      percent: total ? Math.round((count / total) * 100) : 0,
    }));

  const topMood = distribution.length ? distribution[0] : null;

  const buckets = ['Morning', 'Afternoon', 'Evening', 'Night'].map((name) => {
    const top = topEntry(bucketCounts[name]);
    const count = Object.values(bucketCounts[name]).reduce((a, b) => a + b, 0);
    return {
      name,
      count,
      topMood: top ? top.label : null,
      emoji: top ? getMoodEmoji(top.label) : null,
    };
  });

  const activeDays = new Set(safeHistory
    .filter((entry) => entry && entry.created_at)
    .map((entry) => dayKey(new Date(entry.created_at))));

  let streak = 0;
  const cursor = new Date(now);
  if (!activeDays.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weekly = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    const key = dayKey(day);
    const count = safeHistory.filter(
      (entry) => entry && entry.created_at && dayKey(new Date(entry.created_at)) === key
    ).length;
    weekly.push({ key, day: DAY_NAMES[day.getDay()], count });
  }

  const strongestBucket = buckets
    .filter((bucket) => bucket.topMood)
    .sort((a, b) => b.count - a.count)[0];

  let summary = 'Check in with a mood to start building your insights.';
  if (topMood && strongestBucket) {
    summary = `You feel ${topMood.label.toLowerCase()} most often, and your ${strongestBucket.name.toLowerCase()} check-ins are usually ${strongestBucket.topMood.toLowerCase()}.`;
  } else if (topMood) {
    summary = `You feel ${topMood.label.toLowerCase()} most often.`;
  }

  return {
    total,
    topMood,
    distribution,
    buckets,
    streak,
    weekly,
    minutesListened: Math.round(secondsListened / 60),
    summary,
  };
};
