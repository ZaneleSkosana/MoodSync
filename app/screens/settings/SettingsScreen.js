import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { COLORS } from '../../utils/colors';
import { Card, Button } from '../../components/common';

const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [autoPlaylist, setAutoPlaylist] = useState(true);

  const handleNotificationToggle = () => {
    setNotifications(!notifications);
    Alert.alert(
      'Notifications',
      notifications ? 'Notifications disabled' : 'Notifications enabled'
    );
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handlePrivateProfileToggle = () => {
    setPrivateProfile(!privateProfile);
  };

  const handleAutoPlaylistToggle = () => {
    setAutoPlaylist(!autoPlaylist);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'View full privacy policy in your browser');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'View full terms in your browser');
  };

  const handleAbout = () => {
    Alert.alert('About MoodSync', 'MoodSync v1.0.0\n\nMusic for your mood');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🔔</Text>
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: COLORS.gray300, true: COLORS.primaryLight }}
            thumbColor={notifications ? COLORS.primary : COLORS.gray400}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🌙</Text>
            <Text style={styles.settingLabel}>Dark Mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: COLORS.gray300, true: COLORS.primaryLight }}
            thumbColor={darkMode ? COLORS.primary : COLORS.gray400}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🎵</Text>
            <Text style={styles.settingLabel}>Auto Playlist Generation</Text>
          </View>
          <Switch
            value={autoPlaylist}
                        onValueChange={handleAutoPlaylistToggle}
            trackColor={{ false: COLORS.gray300, true: COLORS.primaryLight }}
            thumbColor={autoPlaylist ? COLORS.primary : COLORS.gray400}
          />
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🔒</Text>
            <Text style={styles.settingLabel}>Private Profile</Text>
          </View>
          <Switch
            value={privateProfile}
            onValueChange={handlePrivateProfileToggle}
            trackColor={{ false: COLORS.gray300, true: COLORS.primaryLight }}
            thumbColor={privateProfile ? COLORS.primary : COLORS.gray400}
          />
        </View>

        <TouchableOpacity 
          style={styles.settingRowButton}
          onPress={handleClearCache}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>🗑️</Text>
            <Text style={styles.settingLabel}>Clear Cache</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>About & Support</Text>
        
        <TouchableOpacity 
          style={styles.settingRowButton}
          onPress={handlePrivacyPolicy}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>📋</Text>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingRowButton}
          onPress={handleTermsOfService}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>📄</Text>
            <Text style={styles.settingLabel}>Terms of Service</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingRowButton}
          onPress={handleAbout}
        >
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>ℹ️</Text>
            <Text style={styles.settingLabel}>About MoodSync</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </Card>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>MoodSync v1.0.0</Text>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  sectionCard: {
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
    sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  settingRowButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray900,
  },
  settingArrow: {
    fontSize: 16,
    color: COLORS.gray400,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  spacer: {
    height: 20,
  },
});

export default SettingsScreen;

