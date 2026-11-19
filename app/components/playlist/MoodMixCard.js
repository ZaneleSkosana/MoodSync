import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../../utils/colors';
import { usePlayerStore } from '../../store/playerStore';

const CARD_WIDTH = 128;

/**
 * @param {import('../../services/mood/moodTypes').TrackFeatures} track
 * @param {Array} [queue] the rest of the carousel, so playing one track
 *   queues the others for continuous playback
 * @param {() => void} [onAddToPlaylist]
 */
export const MoodMixCard = ({ track, queue = null, onAddToPlaylist }) => {
  const { currentTrack, isPlaying, play, pause, resume } = usePlayerStore();

  const isCurrentTrack =
    currentTrack && currentTrack.source === track.source && currentTrack.id === track.id;

  const handlePlay = () => {
    if (!track.trackUrl) {
      console.log('This track has no playable audio');
      return;
    }

    if (isCurrentTrack) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      play(track, queue);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.85} onPress={handlePlay} style={styles.artworkWrapper}>
        {track.coverArt ? (
          <Image source={{ uri: track.coverArt }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.placeholderArtwork]}>
            <Text style={styles.placeholderEmoji}>🎵</Text>
          </View>
        )}

        <View style={styles.playButton}>
          <Text style={styles.playIcon}>{isCurrentTrack && isPlaying ? '⏸' : '▶'}</Text>
        </View>

        {onAddToPlaylist && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddToPlaylist}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {track.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {track.artist}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: 14,
  },
  artworkWrapper: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.gray200,
    marginBottom: 8,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  placeholderArtwork: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  playButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: COLORS.white,
    fontSize: 13,
  },
  addButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginTop: -1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  artist: {
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 1,
  },
});

export default MoodMixCard;
