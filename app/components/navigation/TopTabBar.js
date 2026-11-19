import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/colors';
import { ADMIN } from '../../utils/adminTheme';

const TabItem = ({ tab, focused, onPress, onLongPress, variant }) => {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.96)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0.96,
      useNativeDriver: true,
      damping: 14,
      stiffness: 220,
    }).start();
  }, [focused, scale]);

  const isAdmin = variant === 'admin';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={tab.label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.pill,
            focused && (isAdmin ? styles.pillActiveAdmin : styles.pillActive),
            { transform: [{ scale: pressed ? 0.94 : scale }] },
          ]}
        >
          <Text style={[styles.icon, !focused && styles.iconIdle]}>{tab.icon}</Text>
          <Text
            style={[
              styles.label,
              isAdmin && styles.labelAdmin,
              focused && styles.labelActive,
            ]}
            numberOfLines={1}
          >
            {tab.label}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
};

export const TopTabBar = ({ tabs, navigation, variant = 'user' }) => {
  const insets = useSafeAreaInsets();
  const state = navigation.getState();
  const isAdmin = variant === 'admin';

  return (
    <View
      style={[
        styles.bar,
        isAdmin ? styles.barAdmin : styles.barUser,
        { paddingTop: insets.top + 8 },
      ]}
    >
      <View style={styles.row}>
        {tabs.map((tab) => {
          const index = state.routes.findIndex((route) => route.name === tab.name);

          if (index < 0) {
            return null;
          }

          const focused = state.index === index;

          const onPress = () => {
            if (!focused) {
              navigation.navigate(tab.name);
            }
          };

          return (
            <TabItem
              key={tab.name}
              tab={tab}
              focused={focused}
              onPress={onPress}
              variant={variant}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 10,
  },
  barUser: {
    backgroundColor: COLORS.primary,
  },
  barAdmin: {
    backgroundColor: ADMIN.bg,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    paddingHorizontal: 2,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 14,
  },
  pillActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  pillActiveAdmin: {
    backgroundColor: ADMIN.accent,
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
  iconIdle: {
    opacity: 0.75,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  labelAdmin: {
    color: ADMIN.textMuted,
  },
  labelActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
});

export default TopTabBar;
