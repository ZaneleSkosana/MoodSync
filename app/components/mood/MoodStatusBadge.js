import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../utils/colors';
import { useMoodStore } from '../../store/moodStore';

export const MoodStatusBar = ({ compact = false }) => {
  const navigation = useNavigation();
  const { currentMood, activeJourney, getJourneyProgress } = useMoodStore();
  const progress = getJourneyProgress();

  const fillAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const checkInCountRef = useRef(activeJourney?.checkIns.length ?? 0);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    const count = activeJourney?.checkIns.length ?? 0;
    if (count !== checkInCountRef.current) {
      checkInCountRef.current = count;
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
        Animated.spring(pulseAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
  }, [activeJourney?.checkIns.length]);

  if (!currentMood && !activeJourney) {
    return null;
  }

  const handlePress = () => {
    navigation.navigate('MainTabs', {
      screen: 'Library',
      params: { screen: 'MoodHistory' },
    });
  };

  if (!activeJourney) {
    return (
      <TouchableOpacity
        style={[styles.simpleContainer, compact && styles.simpleContainerCompact]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[styles.emoji, compact && styles.emojiCompact]}>{currentMood.emoji}</Text>
        <Text style={[styles.simpleText, compact && styles.simpleTextCompact]} numberOfLines={1}>
          Feeling {currentMood.label}
        </Text>
      </TouchableOpacity>
    );
  }

  const percent = Math.round(progress * 100);
  const widthInterp = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={[styles.container, compact && styles.containerCompact]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {!compact && (
          <Text style={styles.header}>
            {percent}% to feeling {activeJourney.goalMood}
          </Text>
        )}

        <View style={[styles.barRow, compact && styles.barRowCompact]}>
          <Text style={compact ? styles.endEmojiCompact : styles.endEmoji}>
            {activeJourney.startEmoji}
          </Text>

          <View style={[styles.track, compact && styles.trackCompact]}>
            <Animated.View style={[styles.fill, { width: widthInterp }]} />
          </View>

          <Text style={compact ? styles.endEmojiCompact : styles.endEmoji}>
            {activeJourney.goalEmoji}
          </Text>
        </View>

        {compact && <Text style={styles.percentCompact}>{percent}%</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  simpleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  simpleContainerCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 4,
  },
  emoji: { fontSize: 18, marginRight: 6 },
  emojiCompact: { fontSize: 13, marginRight: 4 },
  simpleText: { fontSize: 13, fontWeight: '700', color: COLORS.gray900 },
  simpleTextCompact: { fontSize: 11, fontWeight: '600' },

  container: {
    backgroundColor: COLORS.gray100,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  containerCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  header: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barRowCompact: {
    marginBottom: 2,
  },
  endEmoji: { fontSize: 18 },
  endEmojiCompact: { fontSize: 12 },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gray200,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  trackCompact: {
    height: 5,
    borderRadius: 3,
    marginHorizontal: 5,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  percentCompact: {
    fontSize: 9,
    color: COLORS.gray600,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
});