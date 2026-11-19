import React, {
  useRef,
  useEffect,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';

import { COLORS } from '../../utils/colors';
import { usePlayerStore } from '../../store/playerStore';
import { MoodStatusBar } from '../../components/mood/MoodStatusBadge';

const NowPlayingScreen = ({
  navigation,
}) => {
  const fadeAnim = useRef(
    new Animated.Value(0)
  ).current;

  const scaleAnim = useRef(
    new Animated.Value(0.92)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),

      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 6,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    playNext,
    playPrevious,
    togglePlayPause,
    seekTo,
  } = usePlayerStore();

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>

          <Text style={styles.emptyIcon}>
            🎵
          </Text>

          <Text style={styles.emptyTitle}>
            Nothing Playing
          </Text>

          <Text style={styles.emptyText}>
            Choose a song from Search or
            your recommendations.
          </Text>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={() =>
              navigation.navigate('Search')
            }
          >
            <Text
              style={styles.searchButtonText}
            >
              Find Music
            </Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    );
  }

  const progress =
    duration > 0
      ? Math.min(
          position / duration,
          1
        )
      : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(
      seconds / 60
    );

    const secs = Math.floor(
      seconds % 60
    );

    return `${mins}:${
      secs < 10 ? '0' : ''
    }${secs}`;
  };

  const handleProgressPress = (
    event
  ) => {
    const width =
      event.nativeEvent.locationX;

    if (duration > 0) {
      const percentage =
        Math.max(
          0,
          Math.min(
            width / 300,
            1
          )
        );

      seekTo(
        percentage * duration
      );
    }
  };

  /*
   * Close the full Now Playing screen.
   *
   * This does NOT stop or pause the music.
   */
  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.handleBar} />

      <View style={styles.header}>

        {/* Back button */}
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          NOW PLAYING
        </Text>

        {/* Circular close button */}
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          activeOpacity={0.8}
        >
          <Text style={styles.closeIcon}>
            ×
          </Text>
        </TouchableOpacity>

      </View>

      <View style={styles.content}>

        <Animated.View
          style={[
            styles.artworkShadow,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: scaleAnim,
                },
              ],
            },
          ]}
        >
          {currentTrack.coverArt ? (
            <Image
              source={{
                uri: currentTrack.coverArt,
              }}
              style={styles.artwork}
            />
          ) : (
            <View
              style={[
                styles.artwork,
                styles.artworkPlaceholder,
              ]}
            >
              <Text
                style={
                  styles.placeholderIcon
                }
              >
                🎵
              </Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.trackInfo}>

          <Text
            style={styles.title}
            numberOfLines={2}
          >
            {currentTrack.title}
          </Text>

          <Text
            style={styles.artist}
            numberOfLines={1}
          >
            {currentTrack.artist}
          </Text>

          {currentTrack.album ? (
            <Text
              style={styles.album}
              numberOfLines={1}
            >
              {currentTrack.album}
            </Text>
          ) : null}

          <View style={styles.moodBadgeRow}>
            <MoodStatusBar />
          </View>

        </View>

        <View
          style={styles.progressContainer}
        >
          <TouchableOpacity
            style={styles.progressTrack}
            activeOpacity={1}
            onPress={
              handleProgressPress
            }
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    progress * 100
                  }%`,
                },
              ]}
            />

            <View
              style={[
                styles.progressDot,
                {
                  left: `${
                    progress * 100
                  }%`,
                },
              ]}
            />
          </TouchableOpacity>

          <View style={styles.timeRow}>
            <Text style={styles.time}>
              {formatTime(position)}
            </Text>

            <Text style={styles.time}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>

          <TouchableOpacity
            style={styles.secondaryControl}
          >
            <Text
              style={styles.secondaryIcon}
            >
              🔀
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainControl}
            onPress={playPrevious}
          >
            <Text style={styles.mainIcon}>
              ⏮
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayPause}
          >
            <Text style={styles.playIcon}>
              {isPlaying
                ? '⏸'
                : '▶'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainControl}
            onPress={playNext}
          >
            <Text style={styles.mainIcon}>
              ⏭
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryControl}
          >
            <Text
              style={styles.secondaryIcon}
            >
              🔁
            </Text>
          </TouchableOpacity>

        </View>

        <View style={styles.bottomActions}>

          <TouchableOpacity>
            <Text style={styles.bottomIcon}>
              ♡
            </Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.bottomIcon}>
              ⋯
            </Text>
          </TouchableOpacity>

        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },

  handleBar: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.gray300,
    marginTop: 8,
  },

  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },

  backButton: {
    position: 'absolute',
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
  },

  backIcon: {
    fontSize: 36,
    color: COLORS.gray900,
    lineHeight: 39,
  },

  headerTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.gray600,
  },

  closeButton: {
    position: 'absolute',
    right: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
  },

  closeIcon: {
    fontSize: 28,
    lineHeight: 30,
    color: COLORS.gray700,
    fontWeight: '500',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
  },

  artworkShadow: {
    width: 300,
    height: 300,
    borderRadius: 26,
    elevation: 15,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },

  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },

  artworkPlaceholder: {
    backgroundColor:
      COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderIcon: {
    fontSize: 70,
  },

  trackInfo: {
    width: '100%',
    marginTop: 28,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.gray900,
    marginBottom: 6,
  },

  artist: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray600,
  },

  album: {
    fontSize: 13,
    color: COLORS.gray500,
    marginTop: 4,
  },

  moodBadgeRow: {
    marginTop: 14,
  },

  progressContainer: {
    width: '100%',
    marginTop: 28,
  },

  progressTrack: {
    height: 5,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },

  progressFill: {
    height: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },

  progressDot: {
    position: 'absolute',
    top: -4,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    marginLeft: -6,
  },

  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  time: {
    fontSize: 11,
    color: COLORS.gray500,
    fontWeight: '600',
  },

  controls: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
  },

  secondaryControl: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryIcon: {
    fontSize: 18,
  },

  mainControl: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainIcon: {
    fontSize: 24,
    color: COLORS.gray900,
  },

  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },

  playIcon: {
    color: COLORS.white,
    fontSize: 27,
  },

  bottomActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },

  bottomIcon: {
    fontSize: 27,
    color: COLORS.gray600,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.gray900,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },

  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },

  searchButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default NowPlayingScreen;