import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { COLORS } from '../../utils/colors';
import { usePlayerStore } from '../../store/playerStore';

export const TrackCard = ({
  track,
  onPress,
  onFavorite,
  onAddToPlaylist,
  onRemove,
  isFavorite = false,
  showDuration = true,
  queue = null,
}) => {
  const {
    currentTrack,
    isPlaying,
    play,
    pause,
    resume,
  } = usePlayerStore();

  const isCurrentTrack =
    currentTrack?.id === track.id;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlay = () => {
    if (!track.trackUrl) {
      console.log(
        'This track has no playable audio'
      );
      return;
    }

    if (isCurrentTrack) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }

      return;
    }

    play(track, queue);

    if (onPress) {
      onPress(track);
    }
  };

  return (
    <View
      style={[
        styles.card,
        isCurrentTrack && styles.activeCard,
      ]}
    >
      <TouchableOpacity
        style={styles.playButton}
        onPress={handlePlay}
        activeOpacity={0.8}
      >
        {isCurrentTrack && isPlaying ? (
          <View style={styles.pauseLines}>
            <View style={styles.pauseLine} />
            <View style={styles.pauseLine} />
          </View>
        ) : (
          <Text style={styles.playIcon}>
            ▶
          </Text>
        )}
      </TouchableOpacity>

      {track.coverArt ? (
        <Image
          source={{
            uri: track.coverArt,
          }}
          style={styles.cover}
        />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverIcon}>
            🎵
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.content}
        onPress={handlePlay}
        activeOpacity={0.7}
      >
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              isCurrentTrack &&
                styles.activeTitle,
            ]}
            numberOfLines={1}
          >
            {track.title}
          </Text>

          {isCurrentTrack && (
            <View style={styles.playingBadge}>
              <Text
                style={styles.playingBadgeText}
              >
                {isPlaying ? 'PLAYING' : 'PAUSED'}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={styles.artist}
          numberOfLines={1}
        >
          {track.artist}
        </Text>

        <View style={styles.bottomRow}>
          {track.album && (
            <Text
              style={styles.album}
              numberOfLines={1}
            >
              {track.album}
            </Text>
          )}

          {showDuration && (
            <Text style={styles.duration}>
              {formatDuration(
                track.duration || 0
              )}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {onFavorite && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavorite}
          activeOpacity={0.7}
        >
          <Text style={styles.favoriteIcon}>
            {isFavorite ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      )}

      {onAddToPlaylist && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddToPlaylist}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonIcon}>+</Text>
        </TouchableOpacity>
      )}

      {onRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          activeOpacity={0.7}
        >
          <Text style={styles.removeButtonIcon}>🗑</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 78,
    marginBottom: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  activeCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },

  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  playIcon: {
    color: COLORS.white,
    fontSize: 16,
    marginLeft: 2,
  },

  pauseLines: {
    flexDirection: 'row',
    gap: 3,
  },

  pauseLine: {
    width: 3,
    height: 15,
    borderRadius: 2,
    backgroundColor: COLORS.white,
  },

  cover: {
    width: 58,
    height: 58,
    borderRadius: 11,
    marginRight: 11,
  },

  coverPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 11,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  coverIcon: {
    fontSize: 24,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    flex: 1,
    color: COLORS.gray900,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },

  activeTitle: {
    color: COLORS.primary,
  },

  playingBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 5,
  },

  playingBadgeText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: '800',
  },

  artist: {
    color: COLORS.gray600,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  album: {
    flex: 1,
    color: COLORS.gray500,
    fontSize: 10,
  },

  duration: {
    color: COLORS.gray600,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 8,
  },

  favoriteButton: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
  },

  favoriteIcon: {
    fontSize: 25,
    color: COLORS.primary,
  },

  addButton: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 1,
  },

  addButtonIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray500,
  },

  removeButton: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 1,
  },

  removeButtonIcon: {
    fontSize: 15,
  },
});

export default TrackCard;