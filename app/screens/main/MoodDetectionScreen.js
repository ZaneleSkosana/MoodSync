import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../utils/colors';
import { Button, Card, Loading } from '../../components/common';
import { moodService } from '../../services/moodService';
import { visionService } from '../../services/visionService';
import { useMoodStore } from '../../store/moodStore';
import { useUserStore } from '../../store/userStore';

const { width, height } = Dimensions.get('window');

const MoodDetectionScreen = ({ navigation }) => {
  const [detecting, setDetecting] = useState(false);
  const [detectedMood, setDetectedMood] = useState(null);
  const { setCurrentMood, addMoodToHistory, activeJourney, checkInJourney } = useMoodStore();
  const { user } = useUserStore();

  const startMoodDetection = async () => {
    console.log('START DETECTION PRESSED');

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission Needed', 'We need camera access to detect your mood.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        base64: true,
        quality: 0.5,
        allowsEditing: false,
      });

      console.log('CAMERA RESULT canceled:', result.canceled);

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      console.log('CAMERA: base64 length:', asset.base64?.length);

      setDetecting(true);

      const visionResult = await visionService.analyzeFacePhoto(asset.base64);
      console.log('VISION RESULT:', visionResult);

      if (!visionResult.success) {
        Alert.alert('Detection Failed', visionResult.error);
        setDetecting(false);
        return;
      }

      const moodResult = await moodService.detectMoodFromExpression(visionResult.faceData);
      console.log('MOOD SERVICE RESULT:', moodResult);

      if (moodResult.success) {
        setDetectedMood({
          mood: moodResult.mood,
          confidence: moodResult.confidence,
          emoji: getMoodEmoji(moodResult.mood),
        });
      } else {
        Alert.alert('Error', moodResult.error || 'Could not determine mood.');
      }
    } catch (error) {
      console.log('DETECTION THREW ERROR:', error.message, error);
      Alert.alert('Error', 'Failed to detect mood. Please try again.');
    } finally {
      setDetecting(false);
    }
  };

  const getMoodEmoji = (mood) => {
    const emojis = {
      Happy: '😊',
      Sad: '😢',
      Stressed: '😰',
      Motivated: '💪',
      Calm: '😌',
      Energetic: '⚡',
    };
    return emojis[mood] || '😊';
  };

  const handleConfirmMood = async () => {
    if (!detectedMood) return;

    try {
      const localMoodEntry = {
        id: `local-${Date.now()}`,
        mood_label: detectedMood.mood,
        mood_emoji: detectedMood.emoji,
        score: Math.round(detectedMood.confidence * 10),
        created_at: new Date().toISOString(),
      };

      setCurrentMood({
        id: localMoodEntry.id,
        label: detectedMood.mood,
        emoji: detectedMood.emoji,
      });
      addMoodToHistory(localMoodEntry);

      const playlistParams = { mood: detectedMood.mood, emoji: detectedMood.emoji };

      if (activeJourney) {
        checkInJourney(detectedMood.mood, detectedMood.emoji, localMoodEntry.score);
        navigation.navigate('MoodPlaylist', playlistParams);
      } else {
        navigation.navigate('SetMoodGoal', {
          startMood: detectedMood.mood,
          startEmoji: detectedMood.emoji,
          nextRoute: 'MoodPlaylist',
          nextParams: playlistParams,
        });
      }
    } catch (error) {
      console.log('CONFIRM: THREW ERROR:', error.message, error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleRetry = () => {
    setDetectedMood(null);
    startMoodDetection();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mood Detection</Text>
        <Text style={styles.subtitle}>
          Let's detect your mood using facial expression analysis
        </Text>
      </View>

      <Card style={styles.detectionCard}>
        {!detecting && !detectedMood ? (
          <View style={styles.startContainer}>
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraIcon}>📸</Text>
            </View>
            <Text style={styles.instructionText}>
              Position your face in the camera and we'll detect your current mood
            </Text>
            <Button
              title="Start Detection"
              onPress={startMoodDetection}
              size="large"
              fullWidth
            />
          </View>
        ) : detecting ? (
          <View style={styles.detectingContainer}>
            <Loading visible message="Analyzing your expression..." />
            <View style={styles.scanningAnimation}>
              <Text style={styles.scanningText}>🔍 Scanning...</Text>
            </View>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>{detectedMood?.emoji}</Text>
            <Text style={styles.resultMood}>{detectedMood?.mood}</Text>
            <Text style={styles.confidenceText}>
              {Math.round(detectedMood?.confidence * 100)}% confidence
            </Text>

            <View style={styles.actionButtons}>
              <Button
                title="Use This Mood"
                onPress={handleConfirmMood}
                size="large"
                fullWidth
              />
              <Button
                title="Try Again"
                onPress={handleRetry}
                variant="outline"
                size="large"
                fullWidth
              />
            </View>
          </View>
        )}
      </Card>

      <TouchableOpacity
        style={styles.manualButton}
        onPress={() => navigation.navigate('MoodSelection')}
      >
        <Text style={styles.manualButtonText}>
          Or select mood manually
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  detectionCard: {
    flex: 1,
    padding: 24,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    borderStyle: 'dashed',
  },
  cameraIcon: {
    fontSize: 64,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  detectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningAnimation: {
    marginTop: 20,
  },
  scanningText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  resultMood: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: COLORS.gray600,
    marginBottom: 32,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  manualButton: {
    padding: 16,
    alignItems: 'center',
  },
  manualButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MoodDetectionScreen;