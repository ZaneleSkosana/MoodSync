import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../utils/colors';
import { Button, Card, Loading } from '../../components/common';
import { TrackCard } from '../../components/playlist';
import { useUserStore } from '../../store/userStore';
import { supabaseService } from '../../services/supabaseService';
import { toggleFavorite, feedbackRowToTrack } from '../../services/mood/feedbackService';

const LibraryScreen = ({ navigation }) => {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites_data, setFavoritesData] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const result = await supabaseService.feedback.getFavorites(user.id);
      if (result.success) {
        setFavoritesData((result.data || []).map(feedbackRowToTrack));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleTrackPress = (track) => {
    // TrackCard already handles real playback itself (usePlayerStore.play).
  };

  const handleFavorite = async (track) => {
    // Everything in this list is already a favorite - tapping the heart
    // here always means "remove".
    const result = await toggleFavorite(user.id, track, true);
    if (result.success) {
      setFavoritesData((prev) =>
        prev.filter(
          (t) => !(t.source === track.source && String(t.id) === String(track.id))
        )
      );
    }
  };

    const handleViewMoodHistory = () => {
    navigation.navigate('MoodHistory');
  };

  if (loading) {
    return <Loading visible fullScreen message="Loading library..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Library</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={styles.tabButton}>
          <Text style={styles.tabButtonActive}>Favorites</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={handleViewMoodHistory}
        >
          <Text style={styles.tabButtonText}>Mood History</Text>
        </TouchableOpacity>
      </View>

      {favorites_data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptySubtitle}>
            Mark songs as favorites to build your personal collection
          </Text>
          <Button
            title="Explore Music"
            onPress={() => navigation.navigate('Search')}
            size="large"
            fullWidth
            style={styles.exploreButton}
          />
        </View>
      ) : (
        <FlatList
          data={favorites_data}
          renderItem={({ item }) => (
            <TrackCard
              track={item}
              onPress={() => handleTrackPress(item)}
              onFavorite={() => handleFavorite(item)}
              isFavorite={true}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabButtonActive: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    borderBottomColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    width: '100%',
  },
    listContent: {
    padding: 16,
  },
});

export default LibraryScreen;

