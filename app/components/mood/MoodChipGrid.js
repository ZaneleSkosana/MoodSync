import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/colors';
import { QUICK_MOOD_OPTIONS } from '../../utils/constants';

/**
 * @param {string|null} selectedId one of QUICK_MOOD_OPTIONS' ids, or null
 * @param {(option: {id:string, emoji:string, label:string}) => void} onSelect
 */
export const MoodChipGrid = ({ selectedId, onSelect }) => (
  <View style={styles.grid}>
    {QUICK_MOOD_OPTIONS.map((option) => {
      const selected = option.id === selectedId;
      return (
        <TouchableOpacity
          key={option.id}
          style={[styles.chip, selected && styles.chipSelected]}
          onPress={() => onSelect(option)}
          activeOpacity={0.8}
        >
          <Text style={styles.emoji}>{option.emoji}</Text>
          <Text style={[styles.label, selected && styles.labelSelected]}>
            {option.label.toUpperCase()}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    width: '23.5%',
    aspectRatio: 0.85,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: COLORS.white,
  },
  emoji: {
    fontSize: 26,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  labelSelected: {
    color: COLORS.gray900,
  },
});

export default MoodChipGrid;
