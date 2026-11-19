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
import { PlaylistCard } from '../../components/playlist';
import { useUserStore } from '../../store/userStore';
import { usePlaylistStore } from '../../store/playlistStore';
import { playlistService } from '../../services/playlistService';

const PlaylistScreen = ({ navigation }) => {
  const { user } = useUserStore();
  const { playlists, setPlaylists, deletePlaylist } = usePlaylistStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const result = await playlistService.getUserPlaylists(user.id);
      if (result.success) {
        setPlaylists(result.data);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPlaylists();
    setRefreshing(false);
  };

  const handlePlaylistPress = (playlist) => {
    navigation.navigate('PlaylistDetail', { playlist });
  };

  const handleDeletePlaylist = async (playlistId) => {
    try {
      const result = await playlistService.deletePlaylist(playlistId);
      if (result.success) {
        deletePlaylist(playlistId);
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const handleCreatePlaylist = () => {
    navigation.navigate('MoodSelection');
  };

  if (loading) {
    return <Loading visible fullScreen message="Loading playlists..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Playlists</Text>
        <Button
          title="+ New"
          onPress={handleCreatePlaylist}
          size="small"
          variant="primary"
        />
      </View>

      {playlists.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎵</Text>
          <Text style={styles.emptyTitle}>No Playlists Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first playlist based on your mood and environment
          </Text>
          <Button
            title="Create Playlist"
            onPress={handleCreatePlaylist}
            size="large"
            fullWidth
            style={styles.createButton}
          />
        </View>
      ) : (
        <FlatList
          data={playlists}
          renderItem={({ item }) => (
            <PlaylistCard
              playlist={item}
              onPress={() => handlePlaylistPress(item)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createButton: {
    width: '100%',
  },
  listContent: {
    padding: 16,
  },
});

export default PlaylistScreen;

