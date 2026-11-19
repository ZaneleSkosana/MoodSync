import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { COLORS } from '../../utils/colors';
import { Loading } from '../../components/common';
import { playlistService } from '../../services/playlistService';
import { PLAYLIST_MOODS } from '../../utils/constants';
import { usePlayerStore } from '../../store/playerStore';
import { useMoodStore } from '../../store/moodStore';

const DETECTED_MOOD_COUNT = 10;
const DESIRED_MOOD_COUNT = 15;

const MoodPlaylistScreen = ({ route }) => {
  const { mood, emoji } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState([]);
  const { play, currentTrack, isPlaying } = usePlayerStore();
  const { activeJourney } = useMoodStore();

  useEffect(() => {
    loadTracks();
  }, []);

  const searchForMood = async (moodLabel) => {
    const genres = PLAYLIST_MOODS[moodLabel] || ['Pop'];
    const query = genres.join(' ');
    console.log('MOOD PLAYLIST: searching for', moodLabel, '->', query);
    const result = await playlistService.searchTracks(query);
    return result.success ? result.data : [];
  };

  const loadTracks = async () => {
    setLoading(true);

    try {
      if (activeJourney) {
        const [detectedResults, desiredResults] = await Promise.all([
          searchForMood(mood),
          searchForMood(activeJourney.goalMood),
        ]);

        const detectedTracks = detectedResults.slice(0, DETECTED_MOOD_COUNT);

        const usedIds = new Set(detectedTracks.map((t) => t.id));
        const desiredTracks = desiredResults
          .filter((t) => !usedIds.has(t.id))
          .slice(0, DESIRED_MOOD_COUNT);

        console.log(
          'MOOD PLAYLIST: detected count',
          detectedTracks.length,
          'desired count',
          desiredTracks.length
        );

        setTracks([...detectedTracks, ...desiredTracks]);
      } else {
        const results = await searchForMood(mood);
        setTracks(results);
      }
    } catch (error) {
      console.log('MOOD PLAYLIST LOAD ERROR:', error);
      Alert.alert('Error', 'Could not load songs.');
    }

    setLoading(false);
  };

  const handleTrackPress = (track) => {
    play(track, tracks);
  };

  if (loading) {
    return <Loading visible fullScreen message="Finding songs for your mood..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.title}>{mood} Playlist</Text>
        <Text style={styles.subtitle}>
          {activeJourney
            ? `${DETECTED_MOOD_COUNT} for now, ${DESIRED_MOOD_COUNT} for ${activeJourney.goalMood}`
            : 'Tap a song to play it'}
        </Text>
      </View>

      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const isCurrentTrack = currentTrack?.id === item.id;
          const isFirstDesiredTrack =
            activeJourney && index === DETECTED_MOOD_COUNT;
          return (
            <>
              {isFirstDesiredTrack && (
                <Text style={styles.sectionLabel}>
                  Working toward {activeJourney.goalMood} {activeJourney.goalEmoji}
                </Text>
              )}
              <TouchableOpacity style={styles.trackRow} onPress={() => handleTrackPress(item)}>
                {item.coverArt ? (
                  <Image source={{ uri: item.coverArt }} style={styles.albumArt} />
                ) : (
                  <View style={styles.albumArtPlaceholder} />
                )}
                <View style={styles.trackInfo}>
                  <Text
                    style={[styles.trackName, isCurrentTrack && styles.trackNameActive]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
                </View>
                <Text style={styles.playIcon}>
                  {isCurrentTrack && isPlaying ? '⏸️' : '▶️'}
                </Text>
              </TouchableOpacity>
            </>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No songs found. Try again later.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 140,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  albumArtPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.gray200,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray900,
  },
  trackNameActive: {
    color: COLORS.primary,
  },
  trackArtist: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 2,
  },
  playIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray600,
    marginTop: 40,
  },
});

export default MoodPlaylistScreen;