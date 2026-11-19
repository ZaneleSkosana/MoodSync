import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { COLORS } from '../../utils/colors';
import { MOOD_OPTIONS } from '../../utils/constants';
import { useMoodStore } from '../../store/moodStore';

const SetMoodGoalScreen = ({ route, navigation }) => {
  const { startMood, startEmoji, nextRoute, nextParams } = route.params || {};
  const { startJourney } = useMoodStore();

  const handleSelectGoal = (goalOption) => {
    startJourney(startMood, startEmoji, goalOption.label, goalOption.emoji);
    navigation.replace(nextRoute, nextParams);
  };

  const handleSkip = () => {
    navigation.replace(nextRoute, nextParams);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{startEmoji}</Text>
        <Text style={styles.title}>Feeling {startMood}?</Text>
        <Text style={styles.subtitle}>What do you want to feel instead?</Text>
      </View>

      <FlatList
        data={MOOD_OPTIONS.filter((m) => m.label !== startMood)}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.option, { borderColor: item.color }]}
            onPress={() => handleSelectGoal(item)}
          >
            <Text style={styles.optionEmoji}>{item.emoji}</Text>
            <Text style={styles.optionLabel}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray50, padding: 16 },
  header: { alignItems: 'center', marginVertical: 24 },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.gray900 },
  subtitle: { fontSize: 14, color: COLORS.gray600, marginTop: 4 },
  grid: { paddingBottom: 16 },
  option: {
    flex: 1,
    margin: 8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 24,
    alignItems: 'center',
  },
  optionEmoji: { fontSize: 36, marginBottom: 8 },
  optionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray900 },
  skipButton: { alignItems: 'center', padding: 16 },
  skipText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});

export default SetMoodGoalScreen;