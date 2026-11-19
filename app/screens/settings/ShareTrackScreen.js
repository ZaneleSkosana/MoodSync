import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { COLORS } from '../../utils/colors';
import { Card, Button, Input } from '../../components/common';

const ShareTrackScreen = ({ navigation }) => {
  const [selectedTrack, setSelectedTrack] = useState({
    id: 1,
    title: 'Sample Track',
    artist: 'Sample Artist',
    album: 'Sample Album',
  });

  const handleNativeShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this track: ${selectedTrack.title} by ${selectedTrack.artist}`,
        url: 'https://moodsync.app/track/1',
        title: 'Share Track',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          Alert.alert('Shared', 'Track shared successfully!');
        } else {
          Alert.alert('Shared', 'Track shared successfully!');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share track');
    }
  };

  const handleSocialShare = (platform) => {
    const trackUrl = 'https://moodsync.app/track/1';
    const message = `Check out this track: ${selectedTrack.title} by ${selectedTrack.artist}`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(trackUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackUrl)}`;
        break;
              case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${message} ${trackUrl}`)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(trackUrl)}&text=${encodeURIComponent(message)}`;
        break;
      default:
        Alert.alert('Error', 'Platform not supported');
        return;
    }
    
    Linking.openURL(shareUrl).catch(() => {
      Alert.alert('Error', 'Failed to open sharing platform');
    });
  };

  const handleCopyLink = async () => {
    try {
      const trackUrl = 'https://moodsync.app/track/1';
      await Share.share({
        message: trackUrl,
      });
      Alert.alert('Success', 'Link copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Share Track</Text>
        <Text style={styles.subtitle}>Share your favorite music with friends</Text>
      </View>

      <Card style={styles.trackCard}>
        <Text style={styles.trackTitle}>{selectedTrack.title}</Text>
        <Text style={styles.trackArtist}>by {selectedTrack.artist}</Text>
        <Text style={styles.trackAlbum}>{selectedTrack.album}</Text>
      </Card>

      <Card style={styles.shareOptions}>
        <Text style={styles.sectionTitle}>Quick Share</Text>
        <Button
          title="Share with Native Options"
          onPress={handleNativeShare}
          style={styles.shareButton}
        />
        
        <Button
          title="Copy Link"
          onPress={handleCopyLink}
          style={[styles.shareButton, styles.copyButton]}
          variant="outline"
        />
      </Card>

      <Card style={styles.socialOptions}>
        <Text style={styles.sectionTitle}>Share on Social Media</Text>
        
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialButton, styles.twitterButton]}
            onPress={() => handleSocialShare('twitter')}
          >
            <Text style={styles.socialButtonText}>Twitter</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.socialButton, styles.facebookButton]}
            onPress={() => handleSocialShare('facebook')}
          >
            <Text style={styles.socialButtonText}>Facebook</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialButton, styles.whatsappButton]}
            onPress={() => handleSocialShare('whatsapp')}
          >
            <Text style={styles.socialButtonText}>WhatsApp</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.socialButton, styles.telegramButton]}
            onPress={() => handleSocialShare('telegram')}
          >
            <Text style={styles.socialButtonText}>Telegram</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  trackCard: {
    padding: 20,
    marginBottom: 20,
        alignItems: 'center',
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  trackArtist: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  trackAlbum: {
    fontSize: 16,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  shareOptions: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  shareButton: {
    marginBottom: 12,
  },
  copyButton: {
    borderColor: COLORS.primary,
  },
  socialOptions: {
    padding: 20,
    marginBottom: 20,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  socialButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  twitterButton: {
    backgroundColor: '#1DA1F2',
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  telegramButton: {
    backgroundColor: '#0088CC',
  },
});

export default ShareTrackScreen;


