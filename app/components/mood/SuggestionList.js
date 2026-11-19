import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../utils/colors';
import { usePlayerStore } from '../../store/playerStore';

const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const SuggestionRow = ({ track, index, onPlay, onAdd }) => {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const pause = usePlayerStore((state) => state.pause);
  const resume = usePlayerStore((state) => state.resume);

  const isCurrent =
    currentTrack &&
    String(currentTrack.id) === String(track.id) &&
    (currentTrack.source || '') === (track.source || '');

  const handlePress = () => {
    if (isCurrent) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
      return;
    }
    onPlay(track);
  };

  return (
    <View style={[styles.row, isCurrent && styles.rowActive]}>
      <TouchableOpacity
        style={styles.rowMain}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <View style={styles.coverWrap}>
          {track.coverArt ? (
            <Image source={{ uri: track.coverArt }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Text style={styles.coverIcon}>🎵</Text>
            </View>
          )}
          <View style={styles.coverOverlay}>
            <Text style={styles.coverOverlayText}>
              {isCurrent && isPlaying ? '❚❚' : '▶'}
            </Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text
            style={[styles.title, isCurrent && styles.titleActive]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>

        <Text style={styles.duration}>{formatTime(track.duration)}</Text>
      </TouchableOpacity>

      {onAdd ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAdd(track)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export const SuggestionList = ({
  tracks,
  loading,
  error,
  onPlay,
  onAdd,
  emptyText = 'No songs found right now. Try another selection.',
}) => {
  if (loading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator size="small" color={COLORS.primaryLight} />
        <Text style={styles.stateText}>Finding songs for you...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateIcon}>📡</Text>
        <Text style={styles.stateText}>{error}</Text>
      </View>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateIcon}>🎧</Text>
        <Text style={styles.stateText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View>
      {tracks.map((track, index) => (
        <SuggestionRow
          key={`${track.source}:${track.id}`}
          track={track}
          index={index}
          onPlay={onPlay}
          onAdd={onAdd}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginBottom: 6,
  },
  rowActive: {
    backgroundColor: COLORS.gray50,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  cover: {
    width: 52,
    height: 52,
  },
  coverPlaceholder: {
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverIcon: {
    fontSize: 22,
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,24,39,0.28)',
  },
  coverOverlayText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 2,
  },
  titleActive: {
    color: COLORS.primaryLight,
  },
  artist: {
    fontSize: 13,
    color: COLORS.gray600,
  },
  duration: {
    fontSize: 12,
    color: COLORS.gray500,
    marginRight: 8,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: -2,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  stateIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  stateText: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SuggestionList;
