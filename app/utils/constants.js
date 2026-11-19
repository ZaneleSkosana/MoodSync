export const APP_NAME = 'MoodSync';
export const APP_VERSION = '1.0.0';

export const SUPABASE_URL = 'https://laizezxnuuwjpfjgdzhb.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhaXplenhudXV3anBmamdkemhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjAwNjYsImV4cCI6MjEwMTUzNjA2Nn0.znp9VEUXdUk6kBIgvFYagmILz8SRDoCDfyOEhEvCEzk';

export const GOOGLE_VISION_API_KEY = 'AIzaSyB2UfQ83lld8dqmLhGeTDkmSgiYqsZNFeo';

export const MOOD_OPTIONS = [
  { id: 1, emoji: '😢', label: 'Sad', color: '#60A5FA' },
  { id: 2, emoji: '😊', label: 'Happy', color: '#FCD34D' },
  { id: 3, emoji: '😰', label: 'Stressed', color: '#F87171' },
  { id: 4, emoji: '💪', label: 'Motivated', color: '#34D399' },
  { id: 5, emoji: '😌', label: 'Calm', color: '#A78BFA' },
  { id: 6, emoji: '⚡', label: 'Energetic', color: '#FB923C' },
];

// The 8-chip "quick mood" set used on the Home screen and the Detect
// screen's override grid. Deliberately a separate list from MOOD_OPTIONS
// above (the older manual-selection screen) and from PRIMARY_MOODS in
// moodTypes.js (the detection engine's own valence/arousal categories) -
// "Motivated" and "Romantic" here have no equivalent the camera can ever
// detect on its own, they're manual-only choices, which is fine.
export const QUICK_MOOD_OPTIONS = [
  { id: 'calm', emoji: '😌', label: 'Calm' },
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'excited', emoji: '🤩', label: 'Excited' },
  { id: 'motivated', emoji: '💪', label: 'Motivated' },
  { id: 'worried', emoji: '😟', label: 'Worried' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
  { id: 'romantic', emoji: '😍', label: 'Romantic' },
];

// Maps the detection engine's PRIMARY_MOODS (moodTypes.js) onto the
// closest QUICK_MOOD_OPTIONS id, so a camera-detected mood can highlight a
// chip in this simpler 8-option grid. "Motivated" and "romantic" are never
// produced by classifyPrimaryMood, so nothing maps to them - manual-only.
export const PRIMARY_MOOD_TO_QUICK_MOOD = {
  happy: 'happy',
  sad: 'sad',
  calm: 'calm',
  excited: 'excited',
  angry: 'worried',
  anxious: 'anxious',
  neutral: 'calm',
  uncertain: null,
};

export const ENVIRONMENT_OPTIONS = [
  { id: 1, name: 'Library', icon: '📚' },
  { id: 2, name: 'Gym', icon: '🏋️' },
  { id: 3, name: 'Home', icon: '🏠' },
  { id: 4, name: 'Walk', icon: '🚶' },
  { id: 5, name: 'Kitchen', icon: '🍳' },
  { id: 6, name: 'Office', icon: '💼' },
];

export const SUBSCRIPTION_PLANS = [
  {
    id: 1,
    name: 'Free',
    price: 0,
    duration: 'Forever',
    features: ['Basic mood tracking', '5 playlists', 'Basic recommendations'],
  },
  {
    id: 2,
    name: 'Pro',
    price: 49.99,
    duration: 'Monthly',
    features: ['Unlimited playlists', 'Advanced recommendations', 'Mood history', 'Ad-free'],
  },
  {
    id: 3,
    name: 'Premium',
    price: 99.99,
    duration: 'Yearly',
    features: ['Everything in Pro', 'Facial recognition', 'Family sharing', 'Priority support'],
  },
];

export const PLAYLIST_MOODS = {
  Sad: ['Acoustic', 'Soul', 'Blues'],
  Happy: ['Pop', 'Dance', 'Upbeat'],
  Stressed: ['Ambient', 'Lo-Fi', 'Chill'],
  Motivated: ['Hip-Hop', 'EDM', 'Workout'],
  Calm: ['Classical', 'Meditation', 'Nature Sounds'],
  Energetic: ['Rock', 'Electronic', 'Funk'],
};

export const ENVIRONMENT_MUSIC = {
  Library: { genres: ['Classical', 'Lo-Fi', 'Ambient'], vibe: 'Focus' },
  Gym: { genres: ['Hip-Hop', 'EDM', 'Rock'], vibe: 'Energetic' },
  Home: { genres: ['Pop', 'Indie', 'R&B'], vibe: 'Relaxed' },
  Walk: { genres: ['Indie', 'Acoustic', 'Jazz'], vibe: 'Calm' },
  Kitchen: { genres: ['Funk', 'Soul', 'Upbeat Pop'], vibe: 'Uplifting' },
  Office: { genres: ['Lo-Fi', 'Electronic', 'Ambient'], vibe: 'Focus' },
};

// Replace these placeholder IDs with your real Spotify playlist IDs.
// Find a playlist's ID in its Spotify share link:
// https://open.spotify.com/playlist/THIS_PART_IS_THE_ID?si=...
export const SPOTIFY_MOOD_PLAYLISTS = {
  Happy: 'PLACEHOLDER_HAPPY_ID',
  Sad: 'PLACEHOLDER_SAD_ID',
  Stressed: 'PLACEHOLDER_STRESSED_ID',
  Motivated: 'PLACEHOLDER_MOTIVATED_ID',
  Calm: 'PLACEHOLDER_CALM_ID',
  Energetic: 'PLACEHOLDER_ENERGETIC_ID',
};

export const API_TIMEOUT = 30000;
export const CACHE_DURATION = 3600000;