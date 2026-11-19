import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { COLORS } from '../../utils/colors';

export const PlaylistControls = ({
  onPlay,
  onPause,
  onShuffle,
  onRepeat,
  isPlaying = false,
  repeatMode = 'off',
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.controlButton}
        onPress={onShuffle}
      >
        <Text style={styles.icon}>🔀</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.playButton, isPlaying && styles.pauseButton]}
        onPress={isPlaying ? onPause : onPlay}
      >
        <Text style={styles.playIcon}>
          {isPlaying ? '⏸️' : '▶️'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.controlButton,
          repeatMode !== 'off' && styles.activeControl,
        ]}
        onPress={onRepeat}
      >
        <Text style={styles.icon}>🔁</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControl: {
    backgroundColor: COLORS.primaryLight,
  },
  icon: {
    fontSize: 24,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pauseButton: {
    backgroundColor: COLORS.primaryLight,
  },
  playIcon: {
    fontSize: 32,
    color: COLORS.white,
  },
});
