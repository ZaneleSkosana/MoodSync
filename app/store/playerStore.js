import { create } from 'zustand';
import { createAudioPlayer } from 'expo-audio';
import { useMoodStore } from './moodStore';

const QUALIFY_SECONDS = 30;
const SAVE_INTERVAL_SECONDS = 5;

let audioPlayer = null;
let statusSubscription = null;

const getTrackKey = (track) => {
  if (!track) return null;

  if (track.id !== undefined && track.id !== null) {
    return String(track.id);
  }

  return track.trackUrl ? String(track.trackUrl) : null;
};

const getTrackTitle = (track) =>
  track?.title || track?.name || 'Unknown song';

const getTrackArtist = (track) =>
  track?.artist ||
  track?.artistName ||
  track?.author ||
  'Unknown artist';

const getTrackArtwork = (track) =>
  track?.artwork ||
  track?.artworkUrl ||
  track?.albumArt ||
  track?.image ||
  null;

export const usePlayerStore = create((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  queue: [],
  currentIndex: -1,
  isLoading: false,
  isMiniPlayerVisible: true,

  playbackMoodId: null,
  playbackTrackKeys: [],
  playbackWatchedSeconds: 0,
  playbackQualified: false,
  playbackLastPosition: null,
  playbackSessionId: null,
  playbackSessionStartedAt: null,
  playbackLastSavedSeconds: 0,

  setPlaybackMood: (moodId, tracks = []) => {
    const keys = Array.isArray(tracks)
      ? tracks.map(getTrackKey).filter(Boolean)
      : [];

    set({
      playbackMoodId: moodId || null,
      playbackTrackKeys: keys,
      playbackWatchedSeconds: 0,
      playbackQualified: false,
      playbackLastPosition: null,
      playbackSessionId: null,
      playbackSessionStartedAt: null,
      playbackLastSavedSeconds: 0,
    });
  },

  initializePlayer: () => {
    if (!audioPlayer) {
      audioPlayer = createAudioPlayer(null, {
        updateInterval: 500,
      });

      statusSubscription = audioPlayer.addListener(
        'playbackStatusUpdate',
        (status) => {
          const state = get();
          const currentTime = Number(status.currentTime || 0);
          const trackKey = getTrackKey(state.currentTrack);

          const belongsToMood = Boolean(
            state.playbackMoodId &&
            trackKey &&
            (
              state.playbackTrackKeys.length === 0 ||
              state.playbackTrackKeys.includes(trackKey)
            )
          );

          let watched = state.playbackWatchedSeconds;
          let lastPosition = state.playbackLastPosition;

          if (belongsToMood && status.playing) {
            if (lastPosition !== null) {
              const difference = currentTime - lastPosition;

              // Ignore seeks and unusually large time jumps.
              if (difference > 0 && difference <= 2) {
                watched += difference;
              }
            }

            lastPosition = currentTime;
          } else {
            lastPosition = currentTime;
          }

          const trackQualified = watched >= QUALIFY_SECONDS;

          const shouldSave =
            belongsToMood &&
            state.playbackSessionId &&
            (
              watched - state.playbackLastSavedSeconds >=
                SAVE_INTERVAL_SECONDS ||
              trackQualified
            );

          const shouldQualifyMood =
            belongsToMood &&
            trackQualified &&
            !state.playbackQualified;

          set({
            isPlaying: Boolean(status.playing),
            position: currentTime,
            duration: Number(status.duration || 0),
            isLoading: !status.isLoaded,
            playbackWatchedSeconds: watched,
            playbackLastPosition: lastPosition,
            playbackQualified:
              state.playbackQualified || shouldQualifyMood,
            ...(shouldSave
              ? { playbackLastSavedSeconds: watched }
              : {}),
          });

          if (shouldSave) {
            const now = new Date().toISOString();

            useMoodStore.getState().updatePlayedTrack(
              state.playbackMoodId,
              state.playbackSessionId,
              {
                listened_seconds: Math.floor(watched),
                last_played_at: now,
                qualified: trackQualified,
              }
            );
          }

          if (shouldQualifyMood) {
            useMoodStore.getState().updateMoodPlayback(
              state.playbackMoodId,
              {
                playback_seconds: Math.floor(watched),
                playback_qualified: true,
                playback_qualified_at:
                  new Date().toISOString(),
                playback_track_id: trackKey,
              }
            );
          }

          if (status.didJustFinish) {
            const latest = get();

            if (
              latest.queue.length > 0 &&
              latest.currentIndex < latest.queue.length - 1
            ) {
              latest.playNext();
            } else {
              get().saveCurrentTrackProgress();

              set({
                isPlaying: false,
                position: 0,
                playbackLastPosition: null,
              });
            }
          }
        }
      );
    }

    return audioPlayer;
  },

  saveCurrentTrackProgress: () => {
    const state = get();

    if (
      !state.playbackMoodId ||
      !state.playbackSessionId ||
      !state.currentTrack
    ) {
      return;
    }

    const seconds = Math.floor(
      state.playbackWatchedSeconds || 0
    );

    const qualified = seconds >= QUALIFY_SECONDS;
    const now = new Date().toISOString();

    useMoodStore.getState().updatePlayedTrack(
      state.playbackMoodId,
      state.playbackSessionId,
      {
        listened_seconds: seconds,
        last_played_at: now,
        qualified,
      }
    );

    if (qualified && !state.playbackQualified) {
      useMoodStore.getState().updateMoodPlayback(
        state.playbackMoodId,
        {
          playback_seconds: seconds,
          playback_qualified: true,
          playback_qualified_at: now,
          playback_track_id: getTrackKey(state.currentTrack),
        }
      );

      set({ playbackQualified: true });
    }
  },

  play: async (track, newQueue = null) => {
    try {
      if (!track || !track.trackUrl) {
        console.log('No playable audio URL found');
        return;
      }

      const oldState = get();
      const player = oldState.initializePlayer();

      const sameTrack =
        getTrackKey(oldState.currentTrack) === getTrackKey(track);

      const queue =
        newQueue && newQueue.length
          ? newQueue
          : oldState.queue.length
          ? oldState.queue
          : [track];

      let index = queue.findIndex(
        (item) => getTrackKey(item) === getTrackKey(track)
      );

      if (index < 0) index = 0;

      if (sameTrack) {
        player.play();

        set({
          isPlaying: true,
          isMiniPlayerVisible: true,
        });

        return;
      }

      // Save the previous song before starting another one.
      get().saveCurrentTrackProgress();

      const currentState = get();
      const trackKey = getTrackKey(track);

      const isAssociatedTrack = Boolean(
        currentState.playbackMoodId &&
        trackKey &&
        (
          currentState.playbackTrackKeys.length === 0 ||
          currentState.playbackTrackKeys.includes(trackKey)
        )
      );

      const startedAt = new Date().toISOString();

      const sessionId = isAssociatedTrack
        ? `${currentState.playbackMoodId}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`
        : null;

      set({
        currentTrack: track,
        currentIndex: index,
        queue,
        isLoading: true,
        isPlaying: false,
        position: 0,
        duration: 0,
        playbackWatchedSeconds: 0,
        playbackLastPosition: null,
        playbackSessionId: sessionId,
        playbackSessionStartedAt: isAssociatedTrack
          ? startedAt
          : null,
        playbackLastSavedSeconds: 0,
        isMiniPlayerVisible: true,
      });

      if (isAssociatedTrack && sessionId) {
        useMoodStore.getState().addPlayedTrack(
          currentState.playbackMoodId,
          {
            session_id: sessionId,
            track_id: trackKey,
            title: getTrackTitle(track),
            artist: getTrackArtist(track),
            artwork: getTrackArtwork(track),
            started_at: startedAt,
            last_played_at: startedAt,
            listened_seconds: 0,
            qualified: false,
          }
        );
      }

      player.replace({ uri: track.trackUrl });
      player.play();

      set({
        isPlaying: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Player error:', error);

      set({
        isPlaying: false,
        isLoading: false,
      });
    }
  },

  pause: () => {
    if (!audioPlayer) return;

    get().saveCurrentTrackProgress();
    audioPlayer.pause();

    set({ isPlaying: false });
  },

  resume: () => {
    if (!audioPlayer) return;

    audioPlayer.play();

    set({ isPlaying: true });
  },

  togglePlayPause: () => {
    const state = get();

    if (!state.currentTrack) return;

    if (state.isPlaying) {
      state.pause();
    } else {
      state.resume();
    }
  },

  seekTo: async (seconds) => {
    if (!audioPlayer) return;

    try {
      await audioPlayer.seekTo(seconds);

      set({
        position: seconds,
        playbackLastPosition: seconds,
      });
    } catch (error) {
      console.error('Seek error:', error);
    }
  },

  playNext: () => {
    const state = get();

    if (!state.queue.length || state.currentIndex < 0) return;

    const nextIndex = state.currentIndex + 1;

    if (nextIndex >= state.queue.length) {
      get().saveCurrentTrackProgress();

      set({
        isPlaying: false,
        position: 0,
        playbackLastPosition: null,
      });

      return;
    }

    state.play(state.queue[nextIndex], state.queue);
  },

  playPrevious: () => {
    const state = get();

    if (!state.queue.length || state.currentIndex < 0) return;

    if (state.position > 5) {
      state.seekTo(0);
      return;
    }

    const previousIndex = Math.max(0, state.currentIndex - 1);

    state.play(state.queue[previousIndex], state.queue);
  },

  setQueue: (queue) =>
    set({
      queue: Array.isArray(queue) ? queue : [],
      currentIndex: -1,
    }),

  addToQueue: (track) => {
    if (!track) return;

    set((state) => ({
      queue: [...state.queue, track],
    }));
  },

  removeFromQueue: (trackId) =>
    set((state) => ({
      queue: state.queue.filter(
        (track) => String(track.id) !== String(trackId)
      ),
    })),

  hideMiniPlayer: () => set({ isMiniPlayerVisible: false }),
  showMiniPlayer: () => set({ isMiniPlayerVisible: true }),

  toggleMiniPlayer: () =>
    set((state) => ({
      isMiniPlayerVisible: !state.isMiniPlayerVisible,
    })),

  clearPlayer: () => {
    get().saveCurrentTrackProgress();

    if (audioPlayer) {
      try {
        audioPlayer.pause();
      } catch (error) {
        console.error('Clear player error:', error);
      }
    }

    set({
      currentTrack: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      queue: [],
      currentIndex: -1,
      isLoading: false,
      isMiniPlayerVisible: true,
      playbackMoodId: null,
      playbackTrackKeys: [],
      playbackWatchedSeconds: 0,
      playbackQualified: false,
      playbackLastPosition: null,
      playbackSessionId: null,
      playbackSessionStartedAt: null,
      playbackLastSavedSeconds: 0,
    });
  },

  cleanup: () => {
    get().saveCurrentTrackProgress();

    if (statusSubscription) {
      statusSubscription.remove();
      statusSubscription = null;
    }

    if (audioPlayer) {
      try {
        audioPlayer.remove();
      } catch (error) {
        console.error('Player cleanup error:', error);
      }

      audioPlayer = null;
    }

    set({
      currentTrack: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      queue: [],
      currentIndex: -1,
      isLoading: false,
      isMiniPlayerVisible: true,
      playbackMoodId: null,
      playbackTrackKeys: [],
      playbackWatchedSeconds: 0,
      playbackQualified: false,
      playbackLastPosition: null,
      playbackSessionId: null,
      playbackSessionStartedAt: null,
      playbackLastSavedSeconds: 0,
    });
  },
}));