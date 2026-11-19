import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../../utils/colors';
import { Card } from '../common';

export const PlaylistCard = ({ 
  playlist, 
  onPress, 
  onDelete,
  showActions = true 
}) => {
  return (
    <Card 
      onPress={onPress}
      style={styles.card}
      padding={12}
    >
      <View style={styles.container}>
        <View style={styles.coverContainer}>
          {playlist.cover_image ? (
            <Image
              source={{ uri: playlist.cover_image }}
              style={styles.cover}
            />
          ) : (
            <View style={[styles.cover, styles.placeholderCover]}>
              <Text style={styles.placeholderEmoji}>🎵</Text>
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.playlistName} numberOfLines={2}>
            {playlist.name}
          </Text>
          <Text style={styles.mood}>{playlist.mood} • {playlist.environment}</Text>
          <Text style={styles.trackCount}>{playlist.track_count || 0} tracks</Text>
        </View>

        {showActions && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onDelete}
            >
              <Text style={styles.actionText}>⋮</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coverContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cover: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  placeholderCover: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  contentContainer: {
    flex: 1,
  },
  playlistName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  mood: {
    fontSize: 12,
    color: COLORS.gray600,
    marginBottom: 4,
  },
  trackCount: {
    fontSize: 11,
    color: COLORS.gray500,
  },
  actionsContainer: {
    paddingLeft: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    fontSize: 18,
    color: COLORS.gray600,
  },
});

export default PlaylistCard;
