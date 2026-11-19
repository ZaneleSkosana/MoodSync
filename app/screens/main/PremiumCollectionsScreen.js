import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../utils/colors';
import { useUserStore } from '../../store/userStore';
import { usePlayerStore } from '../../store/playerStore';
import { useSubscriptionStore, selectIsPremium } from '../../store/subscriptionStore';
import { SuggestionList } from '../../components/mood/SuggestionList';
import { AddToPlaylistModal } from '../../components/playlist/AddToPlaylistModal';
import { fetchTracksForTerms } from '../../utils/moodMusic';
import { PREMIUM_SUGGESTION_LIMIT } from '../../utils/plans';

const COLLECTIONS = [
  {
    id: 'focus',
    icon: '🎯',
    title: 'Deep Focus',
    blurb: 'Steady instrumentals for studying and deep work.',
    terms: ['deep focus instrumental', 'study concentration'],
    colors: ['#1E3A8A', '#3B82F6'],
  },
  {
    id: 'sleep',
    icon: '🌙',
    title: 'Sleep',
    blurb: 'Slow, quiet sounds to help you drift off.',
    terms: ['sleep ambient', 'calm piano night'],
    colors: ['#312E81', '#6366F1'],
  },
  {
    id: 'workout',
    icon: '🔥',
    title: 'Workout Power',
    blurb: 'Hard-hitting tracks to push through every set.',
    terms: ['workout energy', 'gym motivation'],
    colors: ['#9A3412', '#F97316'],
  },
  {
    id: 'morning',
    icon: '☀️',
    title: 'Morning Boost',
    blurb: 'Bright, easy songs to start the day well.',
    terms: ['morning acoustic happy', 'good morning vibes'],
    colors: ['#B45309', '#FBBF24'],
  },
  {
    id: 'roadtrip',
    icon: '🚗',
    title: 'Road Trip',
    blurb: 'Sing-along energy for the open road.',
    terms: ['road trip driving', 'summer drive'],
    colors: ['#065F46', '#10B981'],
  },
  {
    id: 'latenight',
    icon: '🌃',
    title: 'Late Night',
    blurb: 'Smooth, moody tracks for after dark.',
    terms: ['late night chill', 'night drive lofi'],
    colors: ['#1F2937', '#6B7280'],
  },
];

const PremiumCollectionsScreen = ({ navigation }) => {
  const [selected, setSelected] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null);

  const { user } = useUserStore();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const play = usePlayerStore((state) => state.play);

  useEffect(() => {
    if (!selected || !isPremium) {
      setTracks([]);
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const result = await fetchTracksForTerms(selected.terms);

      if (cancelled) {
        return;
      }

      if (result.success) {
        setTracks(result.data.slice(0, PREMIUM_SUGGESTION_LIMIT));
      } else {
        setTracks([]);
        setError('We could not load this collection. Check your connection and try again.');
      }

      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [selected, isPremium]);

  const handleSelect = (collection) => {
    if (!isPremium) {
      Alert.alert(
        'Premium feature',
        'Premium Collections are included with Premium.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'See Premium', onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }

    setSelected(collection);
  };

  const handlePlay = (track) => {
    play(track, tracks);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <LinearGradient colors={GRADIENTS.moodGradient} style={styles.hero}>
          <Text style={styles.heroLabel}>PREMIUM COLLECTIONS</Text>
          <Text style={styles.heroTitle}>Music for every moment</Text>
          <Text style={styles.heroBody}>
            Hand-picked searches for focus, sleep, workouts and more, streamed in full.
          </Text>
        </LinearGradient>

        {!isPremium ? (
          <TouchableOpacity
            style={styles.lockBanner}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.85}
          >
            <Text style={styles.lockIcon}>🔒</Text>
            <View style={styles.lockText}>
              <Text style={styles.lockTitle}>Unlock Premium Collections</Text>
              <Text style={styles.lockBody}>Upgrade to listen to every collection.</Text>
            </View>
            <Text style={styles.lockArrow}>→</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.grid}>
          {COLLECTIONS.map((collection) => {
            const isActive = selected?.id === collection.id;
            return (
              <TouchableOpacity
                key={collection.id}
                style={[styles.tileWrap, isActive && styles.tileWrapActive]}
                onPress={() => handleSelect(collection)}
                activeOpacity={0.9}
              >
                <LinearGradient colors={collection.colors} style={styles.tile}>
                  <Text style={styles.tileIcon}>{collection.icon}</Text>
                  <Text style={styles.tileTitle}>{collection.title}</Text>
                  {!isPremium ? <Text style={styles.tileLock}>🔒</Text> : null}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {selected && isPremium ? (
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <Text style={styles.listIcon}>{selected.icon}</Text>
              <View style={styles.listHeaderText}>
                <Text style={styles.listTitle}>{selected.title}</Text>
                <Text style={styles.listBlurb}>{selected.blurb}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.playAll, tracks.length === 0 && styles.playAllDisabled]}
              onPress={() => tracks.length && handlePlay(tracks[0])}
              disabled={tracks.length === 0}
              activeOpacity={0.85}
            >
              <Text style={styles.playAllText}>▶  Play collection</Text>
            </TouchableOpacity>

            <SuggestionList
              tracks={tracks}
              loading={loading}
              error={error}
              onPlay={handlePlay}
              onAdd={(track) => setPlaylistModalTrack(track)}
            />
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
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.85,
    marginBottom: 10,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroBody: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.9,
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  lockIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  lockText: {
    flex: 1,
  },
  lockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  lockBody: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },
  lockArrow: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 10,
    marginTop: 14,
  },
  tileWrap: {
    width: '46%',
    margin: '2%',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  tileWrapActive: {
    borderColor: COLORS.primaryLight,
  },
  tile: {
    height: 108,
    borderRadius: 15,
    padding: 14,
    justifyContent: 'space-between',
  },
  tileIcon: {
    fontSize: 28,
  },
  tileTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  tileLock: {
    position: 'absolute',
    top: 12,
    right: 12,
    fontSize: 14,
  },
  listCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  listIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  listHeaderText: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  listBlurb: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 2,
    lineHeight: 18,
  },
  playAll: {
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  playAllDisabled: {
    opacity: 0.5,
  },
  playAllText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  spacer: {
    height: 120,
  },
});

export default PremiumCollectionsScreen;
