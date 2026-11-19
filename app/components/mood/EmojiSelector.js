import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, FlatList } from 'react-native';
import { MOOD_OPTIONS } from '../../utils/constants';
import { COLORS } from '../../utils/colors';
import { Card } from '../common';

export const EmojiSelector = ({ selectedMood, onMoodSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling?</Text>
      <Text style={styles.subtitle}>Select your current mood</Text>
      
      <FlatList
        data={MOOD_OPTIONS}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.moodButton,
              selectedMood?.id === item.id && styles.moodButtonSelected,
            ]}
            onPress={() => onMoodSelect(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moodButton: {
    width: '31%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },
  moodButtonSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray700,
  },
});
