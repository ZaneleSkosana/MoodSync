// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Name validation
export const validateName = (name) => {
  return name && name.trim().length >= 2;
};

// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format time
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Capitalize first letter
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Mood label -> emoji. Covers both the original manual-selection labels
// (Happy/Sad/Stressed/Motivated/Calm/Energetic) and the multimodal mood
// engine's labels (Excited/Angry/Anxious/Neutral/Uncertain), since both
// write mood_label as a Title-Case string. This was imported by
// moodService.js and MoodHistoryScreen.js but never defined - every
// moodService.saveMood() call was throwing (caught silently, so mood saves
// from manual selection have not actually been persisting).
export const getMoodEmoji = (mood) => {
  const emojis = {
    Happy: '😊',
    Sad: '😢',
    Stressed: '😰',
    Motivated: '💪',
    Calm: '😌',
    Energetic: '⚡',
    Excited: '🤩',
    Angry: '😠',
    Anxious: '😥',
    Neutral: '😐',
    Uncertain: '🤔',
  };
  return emojis[mood] || '🙂';
};

// Format duration (for music tracks)
export const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate playlist name based on mood
export const generatePlaylistName = (mood, environment) => {
  const moodNames = {
    happy: ['Sunshine Vibes', 'Good Mood Mix', 'Happy Days'],
    sad: ['Rainy Day Blues', 'Melancholy Mix', 'Healing Sounds'],
    energetic: ['Power Hour', 'Energy Boost', 'Workout Beats'],
    calm: ['Peaceful Moments', 'Zen Vibes', 'Chill Sessions'],
    angry: ['Release Rage', 'Fire Beats', 'Intense Vibes'],
    romantic: ['Love Songs', 'Heart Beats', 'Romance Mix'],
  };

  const environmentSuffix = {
    home: 'at Home',
    work: 'at Work',
    gym: 'Workout',
    commute: 'on the Go',
    nature: 'in Nature',
  };

  const moodOptions = moodNames[mood] || ['Custom Mix'];
  const randomMood = moodOptions[Math.floor(Math.random() * moodOptions.length)];
  const envSuffix = environmentSuffix[environment] || '';

  return envSuffix ? `${randomMood} ${envSuffix}` : randomMood;
};
