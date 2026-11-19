import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../../utils/colors';
import { useMoodStore } from '../../store/moodStore';

export const MoodJourneyCard = ({ journey }) => {
  const { clearActiveJourney } = useMoodStore();

  if (!journey) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Your Mood Journey</Text>

        <Text style={styles.emptyText}>
          No active journey. Next time you log a mood, you'll be asked what you want to feel instead.
        </Text>
      </View>
    );
  }

  const handleEndJourney = () => {
    Alert.alert(
      'End this journey?',
      "You'll be asked to set a new goal next time you log a mood.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Journey', style: 'destructive', onPress: clearActiveJourney },
      ]
    );
  };

  // Safely handle journeys that do not have checkIns yet.
  const checkIns = Array.isArray(journey.checkIns)
    ? journey.checkIns
    : [];

  const steps = [
    {
      emoji: journey.startEmoji || '🎭',
      label: journey.startMood || 'Starting mood',
    },

    ...checkIns.map((checkIn) => ({
      emoji: checkIn?.emoji || '🎭',
      label: checkIn?.mood || 'Mood check-in',
    })),

    {
      emoji: journey.goalEmoji || '🎯',
      label: journey.goalMood || 'Goal mood',
      isGoal: true,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          Your Mood Journey
        </Text>
        <TouchableOpacity onPress={handleEndJourney}>
          <Text style={styles.endLink}>End</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {journey.startMood || 'Starting mood'} →{' '}
        {journey.goalMood || 'Goal mood'}
      </Text>

      <View style={styles.timeline}>
        {steps.map((step, index) => (
          <View
            key={`${step.label}-${index}`}
            style={styles.stepWrapper}
          >
            <View
              style={[
                styles.stepCircle,
                step.isGoal && styles.stepCircleGoal,
              ]}
            >
              <Text style={styles.stepEmoji}>
                {step.emoji}
              </Text>
            </View>

            {index < steps.length - 1 && (
              <View style={styles.connector} />
            )}
          </View>
        ))}
      </View>

      <Text style={styles.statusText}>
        {checkIns.length === 0
          ? 'Log your mood again to check in'
          : `${checkIns.length} check-in${
              checkIns.length > 1 ? 's' : ''
            } so far`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
  },

  endLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 13,
    color: COLORS.gray500,
  },

  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },

  stepCircleGoal: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.gray50,
  },

  stepEmoji: {
    fontSize: 20,
  },

  connector: {
    width: 16,
    height: 2,
    backgroundColor: COLORS.gray200,
    marginHorizontal: 4,
  },

  statusText: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 12,
  },
});