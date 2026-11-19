import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/colors';

export const Loading = ({ 
  visible = true, 
  message = 'Loading...', 
  fullScreen = false,
  size = 'large',
}) => {
  if (!visible) return null;

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator 
        size={size} 
        color={COLORS.primary} 
      />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray600,
    fontWeight: '500',
  },
});
