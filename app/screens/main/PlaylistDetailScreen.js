import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { COLORS } from '../../utils/colors';
import { Button, Loading } from '../../components/common';
import { TrackCard } from '../../components/playlist';
import { playlistService } from '../../services/playlistService';
import { useUserStore } from '../../store/userStore';
import { toggleFavorite, getFavoriteKeySet } from '../../services/mood/feedbackService';

// tracks.id is this row's own internal id ("this song in this playlist"),
// never suitable for favoriting - it doesn't identify the actual song.
// original_track_id/track_source (added by
// supabase/migrations/20260916000000_add_tracks_source_identity.sql) carry
// the real identity, but only for tracks added after that migration -
// older rows have them null, and favoriting is simply not offered for
// those rather than guessing.
const trackRowToCardTrack = (row) => ({
  id: row.id,
  source: 'itunes',
  title: row.title,
  artist: row.artist,
  album: row.album || undefined,
  duration: row.duration || 0,
  trackUrl: row.track_url || null,
  coverArt: row.cover_art || null,
  originalTrackId: row.original_track_id || null,
  originalTrackSource: row.track_source || null,
});

const formatTotalDuration = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
};

const PlaylistDetailScreen = ({ route, navigation }) => {
  const { playlist } = route.params;
  const { user } = useUserStore();

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [favoriteKeys, setFavoriteKeys] = useState(new Set());

  const loadTracks = useCallback(async () => {
    setLoading(true);
    const result = await playlistService.getPlaylistTracks(playlist.id);
    setTracks(result.success ? (result.data || []).map(trackRowToCardTrack) : []);
    setLoading(false);
  }, [playlist.id]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

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

  const handleFavorite = async (track) => {
    if (!user?.id || !track.originalTrackId) return;

    const key = `${track.originalTrackSource}:${track.originalTrackId}`;
    const currentlyFavorite = favoriteKeys.has(key);

    setFavoriteKeys((prev) => {
      const next = new Set(prev);
      if (currentlyFavorite) next.delete(key);
      else next.add(key);
      return next;
    });

    const result = await toggleFavorite(
      user.id,
      {
        source: track.originalTrackSource,
        id: track.originalTrackId,
        title: track.title,
        artist: track.artist,
        trackUrl: track.trackUrl,
        coverArt: track.coverArt,
        duration: track.duration,
      },
      currentlyFavorite
    );

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

  const handleRemove = (track) => {
    Alert.alert('Remove track?', `Remove "${track.title}" from ${playlist.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const result = await playlistService.removeTrackFromPlaylist(track.id);
          if (result.success) {
            setTracks((prev) => prev.filter((t) => t.id !== track.id));
          } else {
            Alert.alert('Error', "Couldn't remove this track. Please try again.");
          }
        },
      },
    ]);
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete playlist?',
      `"${playlist.name}" and all its tracks will be permanently deleted. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const result = await playlistService.deletePlaylist(playlist.id);
            setDeleting(false);
            if (result.success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', "Couldn't delete this playlist. Please try again.");
            }
          },
        },
      ]
    );
  };

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {playlist.cover_image ? (
          <Image source={{ uri: playlist.cover_image }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.placeholderCover]}>
            <Text style={styles.placeholderEmoji}>🎵</Text>
          </View>
        )}
        <Text style={styles.name} numberOfLines={2}>
          {playlist.name}
        </Text>
        {(playlist.mood || playlist.environment) && (
          <Text style={styles.subtitle}>
            {[playlist.mood, playlist.environment].filter(Boolean).join(' • ')}
          </Text>
        )}
        <Text style={styles.meta}>
          {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          {tracks.length > 0 ? ` · ${formatTotalDuration(totalDuration)}` : ''}
        </Text>
      </View>

      {loading ? (
        <Loading visible message="Loading tracks..." />
      ) : tracks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎧</Text>
          <Text style={styles.emptyTitle}>No tracks yet</Text>
          <Text style={styles.emptyBody}>
            Search for songs and tap "+" to add them to this playlist.
          </Text>
          <Button title="Find Songs" onPress={() => navigation.navigate('Search')} size="medium" />
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TrackCard
              track={item}
              queue={tracks}
              onRemove={() => handleRemove(item)}
              onFavorite={item.originalTrackId ? () => handleFavorite(item) : undefined}
              isFavorite={
                item.originalTrackId
                  ? favoriteKeys.has(`${item.originalTrackSource}:${item.originalTrackId}`)
                  : false
              }
            />
          )}
        />
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeletePlaylist}
        disabled={deleting}
      >
        <Text style={styles.deleteText}>
          {deleting ? 'Deleting...' : 'Delete Playlist'}
        </Text>
      </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  cover: {
    width: 120,
    height: 120,
    borderRadius: 18,
    marginBottom: 14,
  },
  placeholderCover: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 44,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gray900,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  emptyBody: {
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  deleteText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default PlaylistDetailScreen;
