import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../../utils/colors';
import { Button, Card } from '../../components/common';
import { useUserStore } from '../../store/userStore';
import { analyzeFacialEmotion } from '../../services/mood/facialEmotionService';
import { CALIBRATION_LABELS } from '../../services/mood/moodTypes';
import * as calibrationService from '../../services/mood/calibrationService';

const SAMPLES_PER_POSE = 3;
const SAMPLE_INTERVAL_MS = 500;

const POSE_PROMPTS = {
  Neutral: 'Relax your face into how it normally rests - not smiling, not frowning.',
  Happy: 'Smile like you mean it - think of something that genuinely makes you happy.',
  Calm: 'Settle into a relaxed, peaceful expression.',
  Energetic: 'Show some energy and enthusiasm - like you just got great news.',
  Sad: 'Show a low-energy, down expression.',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CalibrationScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const { user } = useUserStore();

  const [completed, setCompleted] = useState({});
  const [activeLabel, setActiveLabel] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState(0);

  const startPose = (label) => {
    setActiveLabel(label);
    setCameraReady(false);
    setProgress(0);
  };

  const cancelPose = () => {
    setActiveLabel(null);
    setCapturing(false);
  };

  const captureForPose = useCallback(async () => {
    if (!cameraRef.current || !cameraReady || !activeLabel) return;

    setCapturing(true);
    const samples = [];

    for (let i = 0; i < SAMPLES_PER_POSE; i += 1) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
          skipProcessing: true,
        });
        const facial = await analyzeFacialEmotion(photo.base64, {
          width: photo.width,
          height: photo.height,
        });
        samples.push(facial);
      } catch (error) {
        console.log('CalibrationScreen: capture failed', error.message);
      }
      setProgress(i + 1);
      if (i < SAMPLES_PER_POSE - 1) await sleep(SAMPLE_INTERVAL_MS);
    }

    const result = await calibrationService.saveBaseline(user?.id, activeLabel, samples);
    setCapturing(false);

    if (!result.success) {
      Alert.alert(
        'No face detected',
        result.error || "Couldn't get a clear reading. Make sure your face is visible and try again."
      );
      return;
    }

    setCompleted((prev) => ({ ...prev, [activeLabel]: true }));
    setActiveLabel(null);
  }, [activeLabel, cameraReady, user]);

  const handleClearCalibration = () => {
    Alert.alert(
      'Clear personalization?',
      'This removes your saved baseline expressions from this device. Mood detection will go back to using the generic model.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await calibrationService.clearCalibration(user?.id);
            setCompleted({});
          },
        },
      ]
    );
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionIcon}>🎯</Text>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          Personalizing mood detection needs a few quick camera captures of your own
          expressions. Nothing is stored except a small on-device summary.
        </Text>
        {permission.canAskAgain ? (
          <Button title="Grant Camera Access" onPress={requestPermission} size="large" fullWidth />
        ) : (
          <Text style={styles.permissionBody}>
            Camera access was denied. You can enable it from your device Settings.
          </Text>
        )}
      </View>
    );
  }

  if (activeLabel) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{activeLabel}</Text>
          <Text style={styles.subtitle}>{POSE_PROMPTS[activeLabel]}</Text>
        </View>

        <View style={styles.cameraBox}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
            onCameraReady={() => setCameraReady(true)}
          />
          {capturing && (
            <View style={styles.captureOverlay}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.captureOverlayText}>
                Sample {progress}/{SAMPLES_PER_POSE}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button
            title={cameraReady ? 'Capture' : 'Preparing camera...'}
            onPress={captureForPose}
            disabled={!cameraReady || capturing}
            loading={capturing}
            size="large"
            fullWidth
          />
          <Button title="Cancel" onPress={cancelPose} variant="ghost" size="medium" fullWidth />
        </View>
      </View>
    );
  }

  const doneCount = Object.keys(completed).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.setupScroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Personalize Detection</Text>
        <Text style={styles.subtitle}>
          Capture a few reference expressions so MoodSync can learn what your face normally
          looks like. This is completely optional - detection works fine without it, using a
          generic model instead.
        </Text>
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.infoText}>
          "Neutral" matters most - it corrects for your individual resting expression so it
          isn't mistaken for an emotion. The rest are optional extras. Everything here is
          stored only on this device, never uploaded.
        </Text>
      </Card>

      {CALIBRATION_LABELS.map((label) => (
        <TouchableOpacity
          key={label}
          style={styles.poseRow}
          onPress={() => startPose(label)}
        >
          <View style={styles.poseRowText}>
            <Text style={styles.poseLabel}>{label}</Text>
            <Text style={styles.poseStatus}>
              {completed[label] ? 'Captured' : 'Not captured yet'}
            </Text>
          </View>
          <Text style={styles.poseIcon}>{completed[label] ? '✅' : '➤'}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.actionButtons}>
        <Button title="Done" onPress={() => navigation.goBack()} size="large" fullWidth />
        {doneCount > 0 && (
          <TouchableOpacity style={styles.manualButton} onPress={handleClearCalibration}>
            <Text style={styles.clearText}>Clear my personalization</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  setupScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 12,
  },
  permissionBody: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.gray700,
    lineHeight: 19,
  },
  poseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  poseRowText: {
    flex: 1,
  },
  poseLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 2,
  },
  poseStatus: {
    fontSize: 13,
    color: COLORS.gray500,
  },
  poseIcon: {
    fontSize: 18,
    marginLeft: 12,
  },
  cameraBox: {
    width: '100%',
    height: 340,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.gray900,
    marginBottom: 16,
  },
  camera: {
    flex: 1,
  },
  captureOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  captureOverlayText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    width: '100%',
    gap: 12,
    marginTop: 12,
  },
  manualButton: {
    padding: 16,
    alignItems: 'center',
  },
  clearText: {
    color: COLORS.error || '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CalibrationScreen;
