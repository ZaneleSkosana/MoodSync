import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';

import { COLORS } from '../../utils/colors';
import { Button, Card } from '../../components/common';
import { EmojiSelector, EnvironmentSelector } from '../../components/mood';
import { SuggestionList } from '../../components/mood/SuggestionList';
import { AddToPlaylistModal } from '../../components/playlist/AddToPlaylistModal';

import { useMoodStore } from '../../store/moodStore';
import { useUserStore } from '../../store/userStore';
import { usePlayerStore } from '../../store/playerStore';
import { useSubscriptionStore, selectIsPremium } from '../../store/subscriptionStore';
import { moodService } from '../../services/moodService';
import { playlistService } from '../../services/playlistService';
import {
  buildSearchTerms,
  fetchTracksForTerms,
  getMoodMusic,
  shuffleTracks,
} from '../../utils/moodMusic';
import {
  FREE_SUGGESTION_LIMIT,
  PREMIUM_SUGGESTION_LIMIT,
} from '../../utils/plans';

const MoodSelectionScreen = ({ navigation, route }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const [pool, setPool] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null);

  const recordedRef = useRef({ key: null, id: null });

  const isPremium = useSubscriptionStore(selectIsPremium);
  const limit = isPremium ? PREMIUM_SUGGESTION_LIMIT : FREE_SUGGESTION_LIMIT;

  const { setCurrentMood, addMoodToHistory, setSelectedEnvironment: setStoreEnvironment } = useMoodStore();
  const { user } = useUserStore();
  const play = usePlayerStore((state) => state.play);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const setPlaybackMood = usePlayerStore((state) => state.setPlaybackMood);

  useEffect(() => {
    if (route.params?.selectedMood) {
      setSelectedMood(route.params.selectedMood);
    }

    if (route.params?.detectedMood) {
      setSelectedMood({
        id: 0,
        emoji: route.params.detectedMood.emoji,
        label: route.params.detectedMood.label,
        color: COLORS.primary,
      });
    }
  }, [route.params]);

  useEffect(() => {
    if (!selectedMood) {
      setPool([]);
      setTracks([]);
      return undefined;
    }

    let cancelled = false;

    const loadSuggestions = async () => {
      setLoadingTracks(true);
      setLoadError(null);

      const terms = buildSearchTerms(selectedMood.label, selectedEnvironment?.name);
      const result = await fetchTracksForTerms(terms);

      if (cancelled) {
        return;
      }

      if (result.success) {
        setPool(result.data);
      } else {
        setPool([]);
        setLoadError('We could not load songs. Check your connection and try again.');
      }

      setLoadingTracks(false);
    };

    loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, [selectedMood?.label, selectedEnvironment?.name]);

  useEffect(() => {
    setTracks(pool.slice(0, limit));
  }, [pool, limit]);

  const moodKey = selectedMood
    ? `${selectedMood.label}|${selectedEnvironment?.name || ''}`
    : null;

  const ensureMoodRecorded = useCallback(() => {
    if (!selectedMood) {
      return null;
    }

    if (recordedRef.current.key === moodKey) {
      return recordedRef.current.id;
    }

    const localMood = {
      id: `local-mood-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      mood_label: selectedMood.label,
      mood_emoji: selectedMood.emoji || null,
      environment: selectedEnvironment?.name || null,
      score: 7,
      created_at: new Date().toISOString(),
      playback_seconds: 0,
      playback_qualified: false,
      playback_qualified_at: null,
      playback_track_id: null,
    };

    setCurrentMood({
      id: selectedMood.id,
      emoji: selectedMood.emoji,
      label: selectedMood.label,
    });

    if (selectedEnvironment) {
      setStoreEnvironment(selectedEnvironment);
    }

    addMoodToHistory(localMood);
    recordedRef.current = { key: moodKey, id: localMood.id };

    return localMood.id;
  }, [selectedMood, selectedEnvironment, moodKey]);

  const handlePlayTrack = (track) => {
    const moodId = ensureMoodRecorded();

    if (moodId) {
      setPlaybackMood(moodId, tracks);
    }

    play(track, tracks);
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) {
      return;
    }

    handlePlayTrack(tracks[0]);
  };

  const handleFreshPicks = () => {
    if (!isPremium) {
      Alert.alert(
        'Premium feature',
        `Fresh picks and ${PREMIUM_SUGGESTION_LIMIT} suggestions per mood come with Mood Mix Plus.`,
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'See Premium',
            onPress: () => navigation.navigate('Profile', { screen: 'Subscription' }),
          },
        ]
      );
      return;
    }

    setPool((current) => shuffleTracks(current));
  };

  const handleSavePlaylist = async () => {
    if (!selectedMood || tracks.length === 0) {
      return;
    }

    setSaving(true);

    try {
      const moodId = ensureMoodRecorded();

      if (moodId) {
        setPlaybackMood(moodId, tracks);
      }

      setQueue(tracks);

      if (!user?.id) {
        Alert.alert('Mood saved', 'Your mood was added to your history.');
        return;
      }

      const environmentName = selectedEnvironment?.name || null;
      const recommendation = environmentName
        ? moodService.getRecommendedPlaylist(selectedMood.label, environmentName)
        : null;

      const created = await playlistService.createPlaylist(user.id, {
        name: recommendation?.name || `${selectedMood.label} Mix`,
        description:
          recommendation?.description ||
          `Songs picked for your ${selectedMood.label.toLowerCase()} mood.`,
        mood: selectedMood.label,
        environment: environmentName,
      });

      const playlist = Array.isArray(created?.data) ? created.data[0] : created?.data;

      if (!created?.success || !playlist?.id) {
        throw new Error(created?.error || 'Could not create the playlist');
      }

      const toSave = tracks.slice(0, FREE_SUGGESTION_LIMIT);

      await Promise.all(
        toSave.map((track, index) =>
          playlistService.addTrackToPlaylist(playlist.id, { ...track, position: index })
        )
      );

      Alert.alert(
        'Playlist saved',
        `"${playlist.name || selectedMood.label + ' Mix'}" was added to your playlists with ${toSave.length} songs.`,
        [
          { text: 'Stay here', style: 'cancel' },
          { text: 'View playlists', onPress: () => navigation.navigate('Playlists') },
        ]
      );
    } catch (error) {
      console.error('Save playlist error:', error);
      Alert.alert('Could not save', 'Your mood was recorded, but the playlist could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const music = selectedMood ? getMoodMusic(selectedMood.label) : null;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Pick Your Mood</Text>
          <Text style={styles.subtitle}>
            Tap an emoji and we will suggest songs for it straight away. No camera needed.
          </Text>
        </View>

        <Card style={styles.moodCard}>
          <EmojiSelector selectedMood={selectedMood} onMoodSelect={setSelectedMood} />
        </Card>

        {selectedMood ? (
          <Card style={styles.suggestCard}>
            <View style={styles.suggestHeader}>
              <Text style={styles.suggestEmoji}>{selectedMood.emoji}</Text>
              <View style={styles.suggestHeaderText}>
                <Text style={styles.suggestTitle}>
                  {selectedMood.label} music for you
                </Text>
                <Text style={styles.suggestBlurb}>{music.blurb}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.primaryAction, tracks.length === 0 && styles.actionDisabled]}
                onPress={handlePlayAll}
                disabled={tracks.length === 0}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionText}>▶  Play all</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={handleFreshPicks}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryActionText}>
                  {isPremium ? '↻  Fresh picks' : '🔒  Fresh picks'}
                </Text>
              </TouchableOpacity>
            </View>

            <SuggestionList
              tracks={tracks}
              loading={loadingTracks}
              error={loadError}
              onPlay={handlePlayTrack}
              onAdd={(track) => setPlaylistModalTrack(track)}
            />

            {!isPremium && tracks.length > 0 && !loadingTracks ? (
              <TouchableOpacity
                style={styles.upsell}
                onPress={() => navigation.navigate('Profile', { screen: 'Subscription' })}
                activeOpacity={0.85}
              >
                <Text style={styles.upsellIcon}>🎧</Text>
                <View style={styles.upsellText}>
                  <Text style={styles.upsellTitle}>Want more songs for this mood?</Text>
                  <Text style={styles.upsellBody}>
                    Mood Mix Plus unlocks {PREMIUM_SUGGESTION_LIMIT} suggestions and fresh picks.
                  </Text>
                </View>
                <Text style={styles.upsellArrow}>→</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        ) : null}

        {selectedMood ? (
          <Card style={styles.environmentCard}>
            <EnvironmentSelector
              selectedEnvironment={selectedEnvironment}
              onEnvironmentSelect={setSelectedEnvironment}
            />
            {selectedEnvironment ? (
              <TouchableOpacity
                style={styles.clearEnvironment}
                onPress={() => setSelectedEnvironment(null)}
              >
                <Text style={styles.clearEnvironmentText}>
                  Clear environment ({selectedEnvironment.name})
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.optionalNote}>
                Optional. Pick where you are to fine-tune the songs.
              </Text>
            )}
          </Card>
        ) : null}

        {selectedMood ? (
          <View style={styles.saveBox}>
            <Button
              title="Save as Playlist"
              onPress={handleSavePlaylist}
              loading={saving}
              disabled={tracks.length === 0}
              fullWidth
              size="large"
            />
            <Text style={styles.saveNote}>
              Saves this mood to your history and the first {FREE_SUGGESTION_LIMIT} songs to a new playlist.
            </Text>
          </View>
        ) : null}

        <View style={styles.spacer} />
      </ScrollView>

      <AddToPlaylistModal
        visible={!!playlistModalTrack}
        track={playlistModalTrack}
        userId={user?.id}
        onClose={() => setPlaylistModalTrack(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray600,
    lineHeight: 20,
  },
  moodCard: {
    margin: 16,
  },
  suggestCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  suggestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  suggestHeaderText: {
    flex: 1,
  },
  suggestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 2,
  },
  suggestBlurb: {
    fontSize: 13,
    color: COLORS.gray600,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  primaryAction: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  primaryActionText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryAction: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  actionDisabled: {
    opacity: 0.5,
  },
  upsell: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  upsellIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  upsellText: {
    flex: 1,
  },
  upsellTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 2,
  },
  upsellBody: {
    fontSize: 12,
    color: COLORS.gray600,
    lineHeight: 17,
  },
  upsellArrow: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 8,
  },
  environmentCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  clearEnvironment: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearEnvironmentText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  optionalNote: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.gray500,
    paddingBottom: 4,
  },
  saveBox: {
    paddingHorizontal: 16,
  },
  saveNote: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 17,
  },
  spacer: {
    height: 120,
  },
});

export default MoodSelectionScreen;
