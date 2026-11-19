import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../../utils/colors';
import { Input, Button } from '../common';
import { playlistService } from '../../services/playlistService';

/**
 * @param {boolean} visible
 * @param {import('../../services/mood/moodTypes').TrackFeatures|null} track
 * @param {string} userId
 * @param {() => void} onClose
 */
export const AddToPlaylistModal = ({ visible, track, userId, onClose }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!visible || !userId) return;

    let cancelled = false;
    setLoading(true);
    playlistService.getUserPlaylists(userId).then((result) => {
      if (cancelled) return;
      setPlaylists(result.success ? result.data || [] : []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [visible, userId]);

  const resetAndClose = () => {
    setNewPlaylistName('');
    onClose();
  };

  const addTrackTo = async (playlistId, playlistName) => {
    if (!track) return;
    setAddingId(playlistId);
    try {
      const result = await playlistService.addTrackToPlaylist(playlistId, track);
      if (result.success) {
        Alert.alert('Added', `"${track.title}" was added to ${playlistName}.`);
        resetAndClose();
      } else {
        Alert.alert('Error', `Couldn't add this track.\n\n${result.error || 'Unknown error'}`);
      }
    } finally {
      setAddingId(null);
    }
  };

  const handleCreateAndAdd = async () => {
    const name = newPlaylistName.trim();
    if (!name || !track) return;

    setCreating(true);
    try {
      const createResult = await playlistService.createPlaylist(userId, { name });
      if (!createResult.success || !createResult.data?.[0]?.id) {
        Alert.alert('Error', `Couldn't create the playlist.\n\n${createResult.error || 'Unknown error'}`);
        return;
      }
      const newPlaylist = createResult.data[0];
      const addResult = await playlistService.addTrackToPlaylist(newPlaylist.id, track);
      if (addResult.success) {
        Alert.alert('Added', `"${track.title}" was added to ${newPlaylist.name}.`);
        resetAndClose();
      } else {
        Alert.alert(
          'Error',
          `Playlist was created, but the track couldn't be added.\n\n${addResult.error || 'Unknown error'}`
        );
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={resetAndClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add to Playlist</Text>
          {track && (
            <Text style={styles.trackName} numberOfLines={1}>
              {track.title} · {track.artist}
            </Text>
          )}

          <View style={styles.createRow}>
            <View style={styles.createInput}>
              <Input
                placeholder="New playlist name"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
              />
            </View>
            <Button
              title="Create"
              onPress={handleCreateAndAdd}
              disabled={!newPlaylistName.trim()}
              loading={creating}
              size="medium"
            />
          </View>

          <Text style={styles.sectionLabel}>Your playlists</Text>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.loadingIndicator} />
          ) : playlists.length === 0 ? (
            <Text style={styles.emptyText}>No playlists yet - create one above.</Text>
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id.toString()}
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playlistRow}
                  onPress={() => addTrackTo(item.id, item.name)}
                  disabled={addingId === item.id}
                >
                  <Text style={styles.playlistIcon}>🎵</Text>
                  <Text style={styles.playlistName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {addingId === item.id ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.addIcon}>+</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={resetAndClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '75%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray300 || COLORS.gray200,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
    textAlign: 'center',
  },
  trackName: {
    fontSize: 13,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  createInput: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray500,
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.gray500,
    paddingVertical: 12,
  },
  list: {
    maxHeight: 260,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    gap: 10,
  },
  playlistIcon: {
    fontSize: 18,
  },
  playlistName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray900,
  },
  addIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray500,
  },
});

export default AddToPlaylistModal;
