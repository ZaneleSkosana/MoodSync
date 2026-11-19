
import React, {
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import {
  COLORS,
  GRADIENTS,
} from '../../utils/colors';

import { useUserStore } from '../../store/userStore';
import { useMoodStore } from '../../store/moodStore';
import { moodService } from '../../services/moodService';
import { playlistService } from '../../services/playlistService';
import {
  rankTracks,
} from '../../services/mood/recommendationEngine';

import {
  QUICK_MOODS,
  getQuickMood,
} from '../../utils/quickMoods';

import {
  MoodMixCard,
  AddToPlaylistModal,
} from '../../components/playlist';

const SOURCES = [
  {
    key: 'audius',
    label: 'Audius',
    available: true,
  },
  {
    key: 'deezer',
    label: 'Deezer',
    available: false,
  },
  {
    key: 'soundcloud',
    label: 'SoundCloud',
    available: false,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    available: false,
  },
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good Morning';
  }

  if (hour < 17) {
    return 'Good Afternoon';
  }

  return 'Good Evening';
}

function getTimeBucket(date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }

  if (hour >= 17 && hour < 21) {
    return 'evening';
  }

  return 'night';
}

function computeTimeOfDayInsight(history) {
  if (!Array.isArray(history) || history.length < 2) {
    return null;
  }

  const nowBucket = getTimeBucket(new Date());
  const counts = {};

  history.forEach((entry) => {
    if (
      !entry ||
      !entry.created_at ||
      !entry.mood_label
    ) {
      return;
    }

    const entryBucket = getTimeBucket(
      new Date(entry.created_at)
    );

    if (entryBucket !== nowBucket) {
      return;
    }

    counts[entry.mood_label] =
      (counts[entry.mood_label] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  );

  if (
    !sorted.length ||
    sorted[0][1] < 2
  ) {
    return null;
  }

  const topMood = sorted[0][0];

  return `You usually feel ${topMood} around this time 👀`;
}

const HomeScreen = ({ navigation }) => {
  const { user } = useUserStore();
  const { currentMood } = useMoodStore();

  const safeQuickMoods = Array.isArray(
    QUICK_MOODS
  )
    ? QUICK_MOODS
    : [];

  const initialQuickMood =
    safeQuickMoods.find(
      (moodItem) =>
        moodItem?.key
          ?.toLowerCase() ===
        currentMood?.label?.toLowerCase()
    )?.key || 'Calm';

  const [selectedQuickMood, setSelectedQuickMood] =
    useState(initialQuickMood);

  const [mixTracks, setMixTracks] =
    useState([]);

  const [mixLoading, setMixLoading] =
    useState(true);

  const [recommendedTracks, setRecommendedTracks] =
    useState([]);

  const [insight, setInsight] =
    useState(null);

  const [playlistModalTrack, setPlaylistModalTrack] =
    useState(null);

  const firstName =
    user?.user_metadata?.full_name
      ?.split(' ')[0] || null;

  useEffect(() => {
    if (!user?.id) {
      setInsight(null);
      return;
    }

    let cancelled = false;

    const loadInsight = async () => {
      try {
        const result =
          await moodService.getUserMoodHistory(
            user.id,
            30
          );

        if (cancelled) {
          return;
        }

        if (result?.success) {
          const history =
            Array.isArray(result.data)
              ? result.data
              : [];

          setInsight(
            computeTimeOfDayInsight(
              history
            )
          );
        } else {
          setInsight(null);
        }
      } catch (error) {
        console.log(
          'Home insight error:',
          error?.message || error
        );

        if (!cancelled) {
          setInsight(null);
        }
      }
    };

    loadInsight();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const loadMix = useCallback(
    async (moodKey) => {
      const mood =
        getQuickMood(moodKey);

      if (!mood) {
        setMixTracks([]);
        setRecommendedTracks([]);
        setMixLoading(false);
        return;
      }

      setMixLoading(true);

      try {
        const searchTerms =
          Array.isArray(mood.searchTerms)
            ? mood.searchTerms
            : [];

        if (searchTerms.length === 0) {
          setMixTracks([]);
          setRecommendedTracks([]);
          setMixLoading(false);
          return;
        }

        const results =
          await Promise.all(
            searchTerms.map((term) =>
              playlistService.searchTracks(
                term
              )
            )
          );

        const primaryResult =
          results[0];

        const secondaryResult =
          results.length > 1
            ? results[1]
            : results[0];

        /*
         * Always convert API results into arrays.
         * This prevents rankTracks() and the UI
         * from receiving undefined or objects.
         */
        const primaryTracks =
          primaryResult?.success &&
          Array.isArray(
            primaryResult.data
          )
            ? primaryResult.data
            : [];

        const secondaryTracks =
          secondaryResult?.success &&
          Array.isArray(
            secondaryResult.data
          )
            ? secondaryResult.data
            : primaryTracks;

        const target = {
          valence: 0,
          arousal: 0.5,
        };

        const rankedPrimary =
          rankTracks(
            primaryTracks,
            target
          );

        const rankedSecondary =
          rankTracks(
            secondaryTracks,
            target
          );

        setMixTracks(
          Array.isArray(rankedPrimary)
            ? rankedPrimary.slice(0, 10)
            : []
        );

        setRecommendedTracks(
          Array.isArray(rankedSecondary)
            ? rankedSecondary
                .slice()
                .reverse()
                .slice(0, 10)
            : []
        );
      } catch (error) {
        console.log(
          'Home music loading error:',
          error?.message || error
        );

        setMixTracks([]);
        setRecommendedTracks([]);
      } finally {
        setMixLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMix(selectedQuickMood);
  }, [
    selectedQuickMood,
    loadMix,
  ]);

  const handleSourceTap = (source) => {
    if (!source?.available) {
      Alert.alert(
        'Coming soon',
        `${source?.label || 'This source'} isn't connected yet - Audius is available now.`
      );
    }
  };

  const mood =
    getQuickMood(selectedQuickMood);

  const safeMood =
    mood || {
      key: 'Calm',
      emoji: '😌',
      searchTerms: [],
    };

  const safeMixTracks =
    Array.isArray(mixTracks)
      ? mixTracks
      : [];

  const safeRecommendedTracks =
    Array.isArray(
      recommendedTracks
    )
      ? recommendedTracks
      : [];

  return (
    <LinearGradient
      colors={
        GRADIENTS.primaryGradient
      }
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View
          style={styles.headerTopRow}
        >
          <Text
            style={styles.greeting}
          >
            {getGreeting()}
            {firstName
              ? `, ${firstName}`
              : ''}
          </Text>

          <TouchableOpacity
            style={
              styles.settingsButton
            }
            onPress={() =>
              navigation.navigate(
                'Profile',
                {
                  screen: 'Settings',
                }
              )
            }
          >
            <Text
              style={styles.settingsIcon}
            >
              ⚙️
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate(
              'Search'
            )
          }
        >
          <Text
            style={
              styles.searchPlaceholder
            }
          >
            🔍 Songs, artists, playlists...
          </Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          style={styles.sourceRow}
          contentContainerStyle={
            styles.sourceRowContent
          }
        >
          {SOURCES.map(
            (source) => (
              <TouchableOpacity
                key={source.key}
                style={[
                  styles.sourcePill,
                  source.available &&
                    styles.sourcePillActive,
                ]}
                onPress={() =>
                  handleSourceTap(
                    source
                  )
                }
              >
                <Text
                  style={[
                    styles.sourcePillText,
                    source.available &&
                      styles.sourcePillTextActive,
                  ]}
                >
                  {source.label}
                </Text>

                {!source.available && (
                  <Text
                    style={
                      styles.sourceSoonBadge
                    }
                  >
                    Soon
                  </Text>
                )}
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* MOOD DETECTION */}
        <TouchableOpacity
          style={
            styles.detectBanner
          }
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate(
              'MoodDetection'
            )
          }
        >
          <Text
            style={
              styles.detectBannerIcon
            }
          >
            📷
          </Text>

          <Text
            style={
              styles.detectBannerText
            }
          >
            Detect my mood automatically
          </Text>

          <Text
            style={
              styles.detectBannerArrow
            }
          >
            →
          </Text>
        </TouchableOpacity>

        {/* INSIGHT */}
        {insight && (
          <View
            style={
              styles.insightCard
            }
          >
            <Text
              style={
                styles.insightText
              }
            >
              📍 {insight}
            </Text>
          </View>
        )}

        {/* MOOD SELECTION */}
        <Text
          style={styles.sectionTitle}
        >
          How are you feeling?
        </Text>

        <View
          style={
            styles.moodGridCard
          }
        >
          <View
            style={styles.moodGrid}
          >
            {safeQuickMoods.map(
              (moodItem) => {
                const isSelected =
                  moodItem.key ===
                  selectedQuickMood;

                return (
                  <TouchableOpacity
                    key={
                      moodItem.key
                    }
                    style={[
                      styles.moodButton,
                      isSelected &&
                        styles.moodButtonSelected,
                    ]}
                    onPress={() =>
                      setSelectedQuickMood(
                        moodItem.key
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={
                        styles.moodEmoji
                      }
                    >
                      {
                        moodItem.emoji
                      }
                    </Text>

                    <Text
                      style={[
                        styles.moodLabel,
                        isSelected &&
                          styles.moodLabelSelected,
                      ]}
                      numberOfLines={
                        1
                      }
                    >
                      {moodItem.key.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </View>

        {/* YOUR MIX */}
        <Text
          style={styles.sectionTitle}
        >
          Your{' '}
          {safeMood.key.toLowerCase()}{' '}
          mix
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.carousel
          }
        >
          {mixLoading ? (
            <Text
              style={
                styles.loadingText
              }
            >
              Finding tracks...
            </Text>
          ) : safeMixTracks.length ===
            0 ? (
            <Text
              style={
                styles.loadingText
              }
            >
              No tracks found right now.
            </Text>
          ) : (
            safeMixTracks.map(
              (track) => (
                <MoodMixCard
                  key={`${track.source}:${track.id}`}
                  track={track}
                  queue={
                    safeMixTracks
                  }
                  onAddToPlaylist={() =>
                    setPlaylistModalTrack(
                      track
                    )
                  }
                />
              )
            )
          )}
        </ScrollView>

        {/* RECOMMENDED */}
        <Text
          style={styles.sectionTitle}
        >
          Recommended for{' '}
          {safeMood.key.toLowerCase()}{' '}
          mood
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.carousel
          }
        >
          {mixLoading ? (
            <Text
              style={
                styles.loadingText
              }
            >
              Finding tracks...
            </Text>
          ) : safeRecommendedTracks.length ===
            0 ? (
            <Text
              style={
                styles.loadingText
              }
            >
              No tracks found right now.
            </Text>
          ) : (
            safeRecommendedTracks.map(
              (track) => (
                <MoodMixCard
                  key={`${track.source}:${track.id}`}
                  track={track}
                  queue={
                    safeRecommendedTracks
                  }
                  onAddToPlaylist={() =>
                    setPlaylistModalTrack(
                      track
                    )
                  }
                />
              )
            )
          )}
        </ScrollView>

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>

      {/* ADD TO PLAYLIST */}
      <AddToPlaylistModal
        visible={
          !!playlistModalTrack
        }
        track={
          playlistModalTrack
        }
        userId={user?.id}
        onClose={() =>
          setPlaylistModalTrack(
            null
          )
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  greeting: {
    flex: 1,
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  settingsIcon: {
    fontSize: 18,
  },

  searchBar: {
    backgroundColor:
      'rgba(255, 255, 255, 0.14)',
    borderRadius: 24,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.25)',
    marginBottom: 14,
  },

  searchPlaceholder: {
    color: COLORS.gray200,
    fontSize: 14,
  },

  sourceRow: {
    flexGrow: 0,
  },

  sourceRowContent: {
    paddingRight: 10,
  },

  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor:
      'rgba(255,255,255,0.14)',
    marginRight: 8,
  },

  sourcePillActive: {
    backgroundColor: COLORS.white,
  },

  sourcePillText: {
    color: COLORS.gray100,
    fontSize: 13,
    fontWeight: '600',
  },

  sourcePillTextActive: {
    color: COLORS.primary,
  },

  sourceSoonBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gray100,
    backgroundColor:
      'rgba(255,255,255,0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 6,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  detectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,

    shadowColor: COLORS.black,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  detectBannerIcon: {
    fontSize: 20,
    marginRight: 10,
  },

  detectBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
  },

  detectBannerArrow: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },

  insightCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  insightText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 12,
    marginTop: 4,
  },

  moodGridCard: {
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },

  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  moodButton: {
    width: '31.5%',
    aspectRatio: 1,
    backgroundColor:
      'rgba(255,255,255,0.12)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  moodButtonSelected: {
    backgroundColor: COLORS.white,
  },

  moodEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },

  moodLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  moodLabelSelected: {
    color: COLORS.gray900,
  },

  carousel: {
    paddingBottom: 4,
    marginBottom: 24,
    paddingRight: 10,
  },

  loadingText: {
    fontSize: 13,
    color: COLORS.gray500,
    paddingVertical: 20,
  },

  bottomSpace: {
    height: 100,
  },
});

export default HomeScreen;

