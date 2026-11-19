import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../utils/colors';

export const BrandedLoading = ({
  tagline = 'Music for Your Mood',
  message = 'Loading MoodSync...',
  footer,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Svg width={64} height={64} viewBox="0 0 24 24">
            <Path
              fill={COLORS.primaryLight}
              d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
            />
          </Svg>
        </View>
        <Text style={styles.appName}>MoodSync</Text>
        <Text style={styles.tagline}>{tagline}</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="large" color={COLORS.white} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {footer ? <Text style={styles.version}>{footer}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.gray200,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    minHeight: 110,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray200,
    fontWeight: '500',
  },
  version: {
    marginTop: 16,
    color: COLORS.gray200,
    fontSize: 12,
  },
});
