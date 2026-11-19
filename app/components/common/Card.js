import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/colors';

export const Card = ({
  children,
  onPress,
  style,
  variant = 'elevated',
  padding = 16,
  borderRadius = 16,
}) => {
  const cardStyles = [
    styles.card,
    styles[variant],
    {
      padding,
      borderRadius,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyles} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
  },
  elevated: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  outline: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  flat: {
    backgroundColor: COLORS.gray50,
  },
});
