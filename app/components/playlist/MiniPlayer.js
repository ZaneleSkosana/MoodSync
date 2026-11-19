import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { COLORS } from '../../utils/colors';
import { usePlayerStore } from '../../store/playerStore';
import { MoodStatusBar } from '../mood/MoodStatusBadge';

const MiniPlayer = () => {
  const navigation = useNavigation();

  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
    isMiniPlayerVisible,
    hideMiniPlayer,
    showMiniPlayer,
  } = usePlayerStore();

  /*
   * If there is no current song, there is nothing to display.
   */
  if (!currentTrack) {
    return null;
  }

  const progress =
    duration > 0
      ? Math.min(position / duration, 1)
      : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  /*
   * When the user closes the MiniPlayer,
   * playback continues in the background.
   *
   * A small music button remains so the user
   * can bring the player back.
   */
  if (!isMiniPlayerVisible) {
    return (
      <View style={styles.hiddenWrapper}>
        <TouchableOpacity
          style={styles.reopenButton}
          onPress={showMiniPlayer}
          activeOpacity={0.8}
        >
          <Text style={styles.reopenIcon}>
            🎵
          </Text>

          <View style={styles.playingDot} />
        </TouchableOpacity>
      </View>
    );
  }

  const openNowPlaying = () => {
    navigation.navigate('NowPlaying');
  };

  const handleClose = () => {
    hideMiniPlayer();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.playerCard}>

        <MoodStatusBar compact />

        {/* Song information */}
        <Pressable
          style={styles.trackArea}
          onPress={openNowPlaying}
        >
          {currentTrack.coverArt ? (
            <Image
              source={{
                uri: currentTrack.coverArt,
              }}
              style={styles.artwork}
            />
          ) : (
            <View style={styles.artworkPlaceholder}>
              <Text style={styles.artworkIcon}>
                🎵
              </Text>
            </View>
          )}

          <View style={styles.trackInfo}>
            <Text
              style={styles.title}
              numberOfLines={1}
            >
              {currentTrack.title}
            </Text>

            <Text
              style={styles.artist}
              numberOfLines={1}
            >
              {currentTrack.artist}
            </Text>
          </View>
        </Pressable>

        {/* Playback controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={playPrevious}
            activeOpacity={0.7}
          >
            <Text style={styles.controlIcon}>
              ⏮
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayPause}
            activeOpacity={0.8}
          >
            <Text style={styles.playIcon}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={playNext}
            activeOpacity={0.7}
          >
            <Text style={styles.controlIcon}>
              ⏭
            </Text>
          </TouchableOpacity>

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeIcon}>
              ×
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress line */}
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>

        {/* Time */}
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            {formatTime(position)}
          </Text>

          <Text style={styles.timeText}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 20,
    zIndex: 1000,
    elevation: 20,
  },

  playerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    elevation: 12,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },

  trackArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 4,
    marginTop: 6,
  },

  artwork: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.gray200,
  },

  artworkPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  artworkIcon: {
    fontSize: 22,
  },

  trackInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 4,
  },

  title: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 3,
  },

  artist: {
    fontSize: 11,
    color: COLORS.gray600,
    fontWeight: '500',
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },

  controlButton: {
    width: 34,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  controlIcon: {
    fontSize: 17,
    color: COLORS.gray900,
  },

  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },

  playIcon: {
    color: COLORS.white,
    fontSize: 15,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  closeIcon: {
    fontSize: 24,
    lineHeight: 26,
    color: COLORS.gray700,
    fontWeight: '500',
  },

  progressBackground: {
    height: 3,
    backgroundColor: COLORS.gray200,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },

  progressFill: {
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
    paddingHorizontal: 2,
  },

  timeText: {
    fontSize: 8,
    color: COLORS.gray500,
    fontWeight: '600',
  },

  /*
   * Small button shown when the MiniPlayer is hidden.
   */
  hiddenWrapper: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    zIndex: 1000,
    elevation: 20,
  },

  reopenButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  reopenIcon: {
    fontSize: 22,
  },

  playingDot: {
    position: 'absolute',
    right: 3,
    top: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});

export default MiniPlayer;