import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';

import { COLORS } from '../../utils/colors';
import { Input, Card } from '../../components/common';
import { TrackCard, AddToPlaylistModal } from '../../components/playlist';
import { playlistService } from '../../services/playlistService';
import { usePlayerStore } from '../../store/playerStore';
import { useUserStore } from '../../store/userStore';
import { toggleFavorite, getFavoriteKeySet } from '../../services/mood/feedbackService';

const SearchScreen = ({
  navigation,
  route,
}) => {
  const [searchQuery, setSearchQuery] =
    useState('');

  const [searchResults, setSearchResults] =
    useState([]);

  const [searched, setSearched] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [favoriteKeys, setFavoriteKeys] =
    useState(new Set());

  const [playlistModalTrack, setPlaylistModalTrack] =
    useState(null);

  const { user } = useUserStore();

  const headerAnim = useRef(
    new Animated.Value(0)
  ).current;

  const {
    setQueue,
  } = usePlayerStore();

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 16,
      stiffness: 140,
    }).start();

    const recommendations =
      route.params
        ?.moodRecommendations;

    if (
      recommendations &&
      recommendations.length > 0
    ) {
      setSearchResults(
        recommendations
      );

      setQueue(recommendations);
      setSearched(true);

      if (route.params?.searchTerm) {
        setSearchQuery(
          route.params.searchTerm
        );
      }
    }
  }, [
    route.params,
    headerAnim,
    setQueue,
  ]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    getFavoriteKeySet(user.id).then((keys) => {
      if (!cancelled) setFavoriteKeys(keys);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSearch = async (
    query = searchQuery
  ) => {
    const trimmedQuery =
      query.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);

    try {
      const result =
        await playlistService.searchTracks(
          trimmedQuery
        );

      if (result.success) {
        setSearchResults(
          result.data
        );

        setQueue(result.data);
      } else {
        setSearchResults([]);
      }

      setSearched(true);
    } catch (error) {
      console.error(
        'Search error:',
        error
      );

      setSearchResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackPress = (
    track
  ) => {
    // TrackCard already handles real playback itself (usePlayerStore.play);
    // this is just a hook for anything else that wants to react to a tap.
  };

  const trackKey = (track) => `${track.source || 'itunes'}:${track.id}`;

  const handleFavorite = async (
    track
  ) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to save favorites.');
      return;
    }

    const key = trackKey(track);
    const currentlyFavorite = favoriteKeys.has(key);

    // Optimistic update - flip the heart immediately, revert if the save fails.
    setFavoriteKeys((prev) => {
      const next = new Set(prev);
      if (currentlyFavorite) next.delete(key);
      else next.add(key);
      return next;
    });

    const result = await toggleFavorite(user.id, track, currentlyFavorite);
    if (!result.success) {
      setFavoriteKeys((prev) => {
        const next = new Set(prev);
        if (currentlyFavorite) next.add(key);
        else next.delete(key);
        return next;
      });
      Alert.alert('Error', "Couldn't update favorites. Please try again.");
    }
  };

  const handleAddToPlaylist = (track) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to use playlists.');
      return;
    }
    setPlaylistModalTrack(track);
  };

  const handleSuggestionPress = (
    suggestion
  ) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const showRecommendations =
    () => {
      const recommendations =
        route.params
          ?.moodRecommendations;

      if (
        recommendations &&
        recommendations.length
      ) {
        setSearchResults(
          recommendations
        );

        setQueue(recommendations);
        setSearched(true);
      }
    };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.searchHeader,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY:
                  headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      -15,
                      0,
                    ],
                  }),
              },
            ],
          },
        ]}
      >
        <View style={styles.searchTitleRow}>
          <View>
            <Text style={styles.eyebrow}>
              DISCOVER
            </Text>

            <Text style={styles.title}>
              Find your sound
            </Text>
          </View>

          <TouchableOpacity
            style={styles.nowPlayingButton}
            onPress={() =>
              navigation.navigate(
                'NowPlaying'
              )
            }
          >
            <Text style={styles.nowPlayingIcon}>
              🎧
            </Text>
          </TouchableOpacity>
        </View>

        <Input
          icon="🔍"
          placeholder="Songs, artists, albums..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          rightIcon="→"
          onRightIconPress={() =>
            handleSearch()
          }
        />
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCircle}>
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.loadingTitle}>
            Finding your music
          </Text>

          <Text style={styles.loadingText}>
            Searching for songs, artists
            and albums...
          </Text>
        </View>
      ) : !searched ? (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={
            false
          }
        >
          {route.params?.mood &&
            route.params?.environment && (
              <Animated.View
                style={[
                  styles.moodHero,
                  {
                    opacity: headerAnim,
                  },
                ]}
              >
                <View
                  style={styles.moodHeroTop}
                >
                  <View>
                    <Text
                      style={
                        styles.moodHeroEyebrow
                      }
                    >
                      MADE FOR YOU
                    </Text>

                    <Text
                      style={
                        styles.moodHeroTitle
                      }
                    >
                      Your mood has a
                      soundtrack
                    </Text>

                    <Text
                      style={
                        styles.moodHeroSubtitle
                      }
                    >
                      {
                        route.params.mood
                          .emoji
                      }{' '}
                      {
                        route.params.mood
                          .label
                      }{' '}
                      •{' '}
                      {
                        route.params
                          .environment
                          .icon
                      }{' '}
                      {
                        route.params
                          .environment
                          .name
                      }
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.moodButton}
                  onPress={
                    showRecommendations
                  }
                >
                  <Text
                    style={
                      styles.moodButtonText
                    }
                  >
                    Play Recommended Music
                  </Text>

                  <Text
                    style={
                      styles.moodButtonIcon
                    }
                  >
                    →
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Search by vibe
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Start with something you
              feel
            </Text>

            <View style={styles.vibeGrid}>
              {[
                {
                  emoji: '☀️',
                  title: 'Happy',
                  query: 'happy upbeat',
                },
                {
                  emoji: '🌙',
                  title: 'Chill',
                  query: 'chill relaxing',
                },
                {
                  emoji: '💔',
                  title: 'Emotional',
                  query: 'emotional',
                },
                {
                  emoji: '🔥',
                  title: 'Energy',
                  query: 'dance workout',
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={styles.vibeCard}
                  onPress={() =>
                    handleSuggestionPress(
                      item.query
                    )
                  }
                >
                  <Text
                    style={styles.vibeEmoji}
                  >
                    {item.emoji}
                  </Text>

                  <Text
                    style={styles.vibeTitle}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Popular searches
            </Text>

            <Card
              style={styles.suggestionsCard}
            >
              {[
                'Drake',
                'The Weeknd',
                'Taylor Swift',
                'Afro House',
              ].map(
                (
                  item,
                  index
                ) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.suggestion,
                      index !== 3 &&
                        styles.suggestionBorder,
                    ]}
                    onPress={() =>
                      handleSuggestionPress(
                        item
                      )
                    }
                  >
                    <Text
                      style={
                        styles.suggestionNumber
                      }
                    >
                      0{index + 1}
                    </Text>

                    <Text
                      style={
                        styles.suggestionText
                      }
                    >
                      {item}
                    </Text>

                    <Text
                      style={
                        styles.suggestionArrow
                      }
                    >
                      →
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </Card>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(
            item,
            index
          ) =>
            item.id
              ? item.id.toString()
              : index.toString()
          }
          renderItem={({ item }) => (
            <TrackCard
              track={item}
              onPress={
                handleTrackPress
              }
              onFavorite={
                () => handleFavorite(item)
              }
              onAddToPlaylist={
                () => handleAddToPlaylist(item)
              }
              isFavorite={
                favoriteKeys.has(trackKey(item))
              }
            />
          )}
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={
            false
          }
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              {route.params?.mood ? (
                <>
                  <Text
                    style={
                      styles.resultsEyebrow
                    }
                  >
                    YOUR MOOD MIX
                  </Text>

                  <Text
                    style={
                      styles.resultsTitle
                    }
                  >
                    Recommended for you
                  </Text>

                  <Text
                    style={
                      styles.resultsSubtitle
                    }
                  >
                    {
                      route.params.mood
                        .emoji
                    }{' '}
                    {
                      route.params.mood
                        .label
                    }{' '}
                    •{' '}
                    {
                      route.params
                        .environment
                        ?.icon
                    }{' '}
                    {
                      route.params
                        .environment
                        ?.name
                    }
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={
                      styles.resultsEyebrow
                    }
                  >
                    SEARCH RESULTS
                  </Text>

                  <Text
                    style={
                      styles.resultsTitle
                    }
                  >
                    Results for "
                    {searchQuery}"
                  </Text>
                </>
              )}
            </View>
          }
          ListEmptyComponent={
            <View
              style={styles.emptyResults}
            >
              <Text
                style={styles.emptyIcon}
              >
                🎧
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                No music found
              </Text>

              <Text
                style={styles.emptySubtitle}
              >
                Try another artist, song or
                search term.
              </Text>

              <TouchableOpacity
                style={styles.tryAgain}
                onPress={() => {
                  setSearchQuery('');
                  setSearched(false);
                }}
              >
                <Text
                  style={styles.tryAgainText}
                >
                  Search Again
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

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
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },

  searchHeader: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },

  searchTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.primary,
    marginBottom: 4,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.gray900,
  },

  nowPlayingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  nowPlayingIcon: {
    fontSize: 21,
  },

  content: {
    flex: 1,
  },

  moodHero: {
    margin: 16,
    padding: 20,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    elevation: 7,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },

  moodHeroTop: {
    marginBottom: 20,
  },

  moodHeroEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 8,
  },

  moodHeroTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 28,
    marginBottom: 8,
  },

  moodHeroSubtitle: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.85,
  },

  moodButton: {
    backgroundColor: COLORS.white,
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  moodButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  moodButtonIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },

  section: {
    marginHorizontal: 16,
    marginTop: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.gray900,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 4,
    marginBottom: 14,
  },

  vibeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  vibeCard: {
    width: '48%',
    minHeight: 105,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: 15,
    justifyContent: 'space-between',
  },

  vibeEmoji: {
    fontSize: 28,
  },

  vibeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gray900,
  },

  suggestionsCard: {
    paddingVertical: 0,
    overflow: 'hidden',
  },

  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },

  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },

  suggestionNumber: {
    width: 38,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },

  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
  },

  suggestionArrow: {
    fontSize: 18,
    color: COLORS.gray500,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  loadingTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.gray900,
  },

  loadingText: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 6,
  },

  listContent: {
    padding: 16,
    paddingBottom: 180,
  },

  resultsHeader: {
    marginBottom: 16,
  },

  resultsEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.primary,
    marginBottom: 6,
  },

  resultsTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.gray900,
  },

  resultsSubtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 5,
  },

  emptyResults: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 70,
  },

  emptyIcon: {
    fontSize: 60,
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.gray900,
    marginBottom: 7,
  },

  emptySubtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 20,
  },

  tryAgain: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
  },

  tryAgainText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
});

export default SearchScreen;