import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TARGET_JOURNEY_STEPS } from '../utils/moodJourney';

export const useMoodStore = create(
  persist(
    (set, get) => ({
      currentMood: null,
      moodHistory: [],
      selectedEnvironment: null,
      isLoading: false,
      activeJourney: null,
      journeyHistory: [],

      setCurrentMood: (mood) => set({ currentMood: mood }),

      setSelectedEnvironment: (environment) =>
        set({ selectedEnvironment: environment }),

      addMoodToHistory: (mood) =>
        set((state) => ({
          moodHistory: [
            mood,
            ...state.moodHistory.filter(
              (item) => item?.id !== mood?.id
            ),
          ],
          currentMood: mood,
        })),

      setMoodHistory: (history) =>
        set({
          moodHistory: Array.isArray(history) ? history : [],
        }),

      updateMoodPlayback: (moodId, playbackData) =>
        set((state) => ({
          moodHistory: state.moodHistory.map((mood) =>
            String(mood?.id) === String(moodId)
              ? { ...mood, ...playbackData }
              : mood
          ),
        })),

      // Add a song session to the selected mood.
      addPlayedTrack: (moodId, trackSession) =>
        set((state) => ({
          moodHistory: state.moodHistory.map((mood) => {
            if (String(mood?.id) !== String(moodId)) {
              return mood;
            }

            const tracks = Array.isArray(mood.played_tracks)
              ? mood.played_tracks
              : [];

            const exists = tracks.some(
              (track) =>
                track.session_id === trackSession.session_id
            );

            return {
              ...mood,
              played_tracks: exists
                ? tracks.map((track) =>
                    track.session_id === trackSession.session_id
                      ? { ...track, ...trackSession }
                      : track
                  )
                : [...tracks, trackSession],
            };
          }),
        })),

      // Update listening time for a particular song session.
      updatePlayedTrack: (moodId, sessionId, playbackData) =>
        set((state) => ({
          moodHistory: state.moodHistory.map((mood) => {
            if (String(mood?.id) !== String(moodId)) {
              return mood;
            }

            return {
              ...mood,
              played_tracks: (
                Array.isArray(mood.played_tracks)
                  ? mood.played_tracks
                  : []
              ).map((track) =>
                track.session_id === sessionId
                  ? { ...track, ...playbackData }
                  : track
              ),
            };
          }),
        })),

      deleteMoodFromHistory: (moodId) =>
        set((state) => ({
          moodHistory: state.moodHistory.filter(
            (mood) => String(mood?.id) !== String(moodId)
          ),
        })),

      clearCurrentMood: () =>
        set({
          currentMood: null,
          selectedEnvironment: null,
        }),

      getMoodTrend: () => {
        const history = get().moodHistory;
        return history.length ? history.slice(0, 14) : null;
      },

      setLoading: (isLoading) => set({ isLoading }),

      startJourney: (
        startMood,
        startEmoji,
        goalMood,
        goalEmoji
      ) =>
        set({
          activeJourney: {
            id: `journey-${Date.now()}`,
            startMood,
            startEmoji,
            goalMood,
            goalEmoji,
            startedAt: new Date().toISOString(),
            checkIns: [],
            achieved: false,
          },
        }),

      checkInJourney: (mood, emoji, score) =>
        set((state) => {
          if (!state.activeJourney) return {};

          const achieved = mood === state.activeJourney.goalMood;

          const updatedJourney = {
            ...state.activeJourney,
            checkIns: [
              ...state.activeJourney.checkIns,
              {
                mood,
                emoji,
                score,
                timestamp: new Date().toISOString(),
              },
            ],
            achieved,
            achievedAt: achieved
              ? new Date().toISOString()
              : null,
          };

          return achieved
            ? {
                activeJourney: null,
                journeyHistory: [
                  updatedJourney,
                  ...state.journeyHistory,
                ],
              }
            : { activeJourney: updatedJourney };
        }),

      clearActiveJourney: () =>
        set((state) => {
          if (!state.activeJourney) return {};

          return {
            journeyHistory: [
              state.activeJourney,
              ...state.journeyHistory,
            ],
            activeJourney: null,
          };
        }),

      // Progress toward the goal, 0 to 1, driving the fill bar/percentage
      // in MoodStatusBadge.js and the genre blend in MoodPlaylistScreen.js.
      // Capped below 1 until the goal mood is actually matched (at which
      // point checkInJourney clears activeJourney entirely).
      getJourneyProgress: () => {
        const state = get();
        if (!state.activeJourney) return 0;
        const ratio = state.activeJourney.checkIns.length / TARGET_JOURNEY_STEPS;
        return Math.min(ratio, 0.95);
      },
    }),
    {
      name: 'moodsync-local-mood-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentMood: state.currentMood,
        moodHistory: state.moodHistory,
        selectedEnvironment: state.selectedEnvironment,
        activeJourney: state.activeJourney,
        journeyHistory: state.journeyHistory,
      }),
    }
  )
);