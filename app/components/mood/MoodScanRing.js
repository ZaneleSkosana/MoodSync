import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { CameraView } from 'expo-camera';
import { COLORS } from '../../utils/colors';

const SIZE = 260;
const BRACKET_INSET = 34;
const BRACKET_SIZE = 28;

const CornerBrackets = ({ color }) => (
  <>
    <View style={[styles.bracket, styles.bracketTL, { borderColor: color }]} />
    <View style={[styles.bracket, styles.bracketTR, { borderColor: color }]} />
    <View style={[styles.bracket, styles.bracketBL, { borderColor: color }]} />
    <View style={[styles.bracket, styles.bracketBR, { borderColor: color }]} />
  </>
);

/**
 * @param {import('react').Ref} cameraRef
 * @param {'scanning'|'captured'} phase
 * @param {() => void} onCameraReady
 */
export const MoodScanRing = ({ cameraRef, phase, onCameraReady }) => {
  const scanLine = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== 'scanning') return undefined;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase, scanLine]);

  useEffect(() => {
    if (phase !== 'captured') return undefined;

    const makePulse = (value, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    const loop1 = makePulse(pulse1, 0);
    const loop2 = makePulse(pulse2, 900);
    loop1.start();
    loop2.start();
    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [phase, pulse1, pulse2]);

  const scanTranslateY = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIZE * 0.32, SIZE * 0.32],
  });

  const ringColor = phase === 'captured' ? COLORS.success : COLORS.secondary;

  const renderPulse = (value) => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulseRing,
        {
          borderColor: COLORS.success,
          opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
          transform: [
            {
              scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
            },
          ],
        },
      ]}
    />
  );

  return (
    <View style={styles.wrapper}>
      <View style={[styles.glow, { shadowColor: ringColor }]} />
      <View style={[styles.ring, { borderColor: ringColor }]}>
        <View style={styles.circleClip}>
          {phase === 'captured' ? (
            <View style={styles.capturedFace}>
              {phase === 'captured' && renderPulse(pulse1)}
              {phase === 'captured' && renderPulse(pulse2)}
              <Text style={styles.capturedEmoji}>🙂</Text>
            </View>
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="front"
              onCameraReady={onCameraReady}
            />
          )}
        </View>

        {phase === 'scanning' && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanTranslateY }] },
            ]}
          />
        )}

        <CornerBrackets color={ringColor} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  circleClip: {
    width: SIZE - 6,
    height: SIZE - 6,
    borderRadius: (SIZE - 6) / 2,
    overflow: 'hidden',
    backgroundColor: COLORS.gray900,
  },
  camera: {
    flex: 1,
  },
  capturedFace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedEmoji: {
    fontSize: 84,
  },
  pulseRing: {
    position: 'absolute',
    width: SIZE - 40,
    height: SIZE - 40,
    borderRadius: (SIZE - 40) / 2,
    borderWidth: 2,
  },
  scanLine: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    height: 2,
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  bracket: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderWidth: 3,
  },
  bracketTL: {
    top: BRACKET_INSET,
    left: BRACKET_INSET,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
  },
  bracketTR: {
    top: BRACKET_INSET,
    right: BRACKET_INSET,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 6,
  },
  bracketBL: {
    bottom: BRACKET_INSET,
    left: BRACKET_INSET,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
  },
  bracketBR: {
    bottom: BRACKET_INSET,
    right: BRACKET_INSET,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 6,
  },
});

export default MoodScanRing;
