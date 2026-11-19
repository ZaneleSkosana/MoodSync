import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, FlatList } from 'react-native';
import { ENVIRONMENT_OPTIONS } from '../../utils/constants';
import { COLORS } from '../../utils/colors';

export const EnvironmentSelector = ({ selectedEnvironment, onEnvironmentSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where are you?</Text>
      <Text style={styles.subtitle}>Select your environment</Text>
      
      <FlatList
        data={ENVIRONMENT_OPTIONS}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.envButton,
              selectedEnvironment?.id === item.id && styles.envButtonSelected,
            ]}
            onPress={() => onEnvironmentSelect(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
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
  envButton: {
    width: '48%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: COLORS.gray50,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  envButtonSelected: {
    backgroundColor: COLORS.secondaryLight,
    borderColor: COLORS.secondary,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray700,
  },
});
