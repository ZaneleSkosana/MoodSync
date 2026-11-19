import { playlistService } from '../services/playlistService';

const MOOD_MUSIC = {
  sad: {
    keyword: 'sad',
    blurb: 'Gentle, emotional songs to sit with how you feel.',
    terms: ['sad acoustic ballad', 'emotional piano'],
  },
  happy: {
    keyword: 'happy',
    blurb: 'Bright, feel-good songs to lift the day even higher.',
    terms: ['feel good upbeat pop', 'happy summer vibes'],
  },
  stressed: {
    keyword: 'calming',
    blurb: 'Soothing sounds to slow your breathing and ease the tension.',
    terms: ['calming ambient instrumental', 'stress relief relaxing'],
  },
  anxious: {
    keyword: 'calming',
    blurb: 'Soft, steady music to help you settle and breathe.',
    terms: ['calming ambient instrumental', 'peaceful meditation'],
  },
  worried: {
    keyword: 'calming',
    blurb: 'Gentle, reassuring music to quiet a busy mind.',
    terms: ['calming ambient instrumental', 'soft acoustic comfort'],
  },
  motivated: {
    keyword: 'motivation',
    blurb: 'Driving beats and big energy to get things done.',
    terms: ['upbeat workout motivation', 'powerful hip hop energy'],
  },
  calm: {
    keyword: 'chill',
    blurb: 'Smooth, easy listening to keep the calm going.',
    terms: ['calm acoustic chill', 'lofi relax'],
  },
  energetic: {
    keyword: 'energy',
    blurb: 'High-tempo tracks that keep you moving.',
    terms: ['high energy dance', 'edm party'],
  },
  excited: {
    keyword: 'dance',
    blurb: 'Big, bold songs to match your excitement.',
    terms: ['high energy dance pop', 'party hype'],
  },
  romantic: {
    keyword: 'love',
    blurb: 'Warm, tender songs for a romantic mood.',
    terms: ['romantic love songs', 'smooth rnb love'],
  },
  angry: {
    keyword: 'intense',
    blurb: 'Raw, intense tracks to let it all out.',
    terms: ['intense rock energy', 'aggressive trap'],
  },
  neutral: {
    keyword: 'chill',
    blurb: 'Easy, balanced listening for any moment.',
    terms: ['chill vibes', 'easy listening instrumental'],
  },
};

const ENVIRONMENT_KEYWORDS = {
  library: 'study focus',
  gym: 'workout',
  home: 'relax',
  walk: 'walking',
  kitchen: 'cooking',
  office: 'focus work',
};

export const getMoodMusic = (label) => {
  const key = String(label || '').trim().toLowerCase();
  return MOOD_MUSIC[key] || MOOD_MUSIC.neutral;
};

export const buildSearchTerms = (label, environmentName) => {
  const music = getMoodMusic(label);
  const environmentKeyword =
    ENVIRONMENT_KEYWORDS[String(environmentName || '').trim().toLowerCase()];

  if (environmentKeyword) {
    return [`${music.keyword} ${environmentKeyword}`, ...music.terms];
  }

  return [...music.terms];
};

export const shuffleTracks = (tracks) => {
  const copy = Array.isArray(tracks) ? [...tracks] : [];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
};

const interleaveUnique = (lists) => {
  const seen = new Set();
  const merged = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));

  for (let index = 0; index < longest; index += 1) {
    lists.forEach((list) => {
      const track = list[index];
      if (track && !seen.has(track.id)) {
        seen.add(track.id);
        merged.push(track);
      }
    });
  }

  return merged;
};

export const fetchTracksForTerms = async (terms) => {
  const results = await Promise.all(
    (terms || []).map((term) => playlistService.searchTracks(term))
  );

  const lists = results
    .filter((result) => result && result.success)
    .map((result) => (Array.isArray(result.data) ? result.data : []));

  if (lists.length === 0) {
    const failed = results.find((result) => result && !result.success);
    return {
      success: false,
      error: failed?.error || 'Could not load music right now.',
    };
  }

  return { success: true, data: interleaveUnique(lists) };
};
