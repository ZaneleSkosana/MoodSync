import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { COLORS } from '../../utils/colors';
import {
  Button,
  Card,
  Input,
  Loading,
} from '../../components/common';

import { useUserStore } from '../../store/userStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { supabaseService } from '../../services/supabaseService';

const ProfileScreen = ({
  navigation,
}) => {
  const {
    user,
    logout,
    updateUserProfile,
  } = useUserStore();

  const {
    currentPlan,
    isSubscriptionActive,
  } = useSubscriptionStore();

  const [loading, setLoading] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [profile, setProfile] =
    useState({
      fullName:
        user?.user_metadata?.full_name ||
        '',
      email: user?.email || '',
      bio: '',
    });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const result =
        await supabaseService.users.getProfile(
          user.id
        );

      if (
        result.success &&
        result.data
      ) {
        setProfile((prev) => ({
          ...prev,
          bio:
            result.data.bio || '',
          fullName:
            result.data.full_name ||
            prev.fullName,
        }));
      }
    } catch (error) {
      console.error(
        'Error loading profile:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile =
    async () => {
      try {
        setLoading(true);

        const result =
          await supabaseService.users.updateProfile(
            user.id,
            {
              full_name:
                profile.fullName,
              bio: profile.bio,
              updated_at:
                new Date().toISOString(),
            }
          );

        if (result.success) {
          updateUserProfile({
            user_metadata: {
              full_name:
                profile.fullName,
            },
          });

          setEditing(false);

          Alert.alert(
            'Success',
            'Profile updated successfully'
          );
        }
      } catch (error) {
        Alert.alert(
          'Error',
          'Failed to update profile'
        );
      } finally {
        setLoading(false);
      }
    };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
        },
        {
          text: 'Logout',
          onPress: async () => {
            const result =
              await supabaseService.auth.signOut();

            if (result.success) {
              logout();
            } else {
              Alert.alert(
                'Error',
                'Failed to logout. Please try again.'
              );
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (
    loading &&
    !profile.fullName
  ) {
    return (
      <Loading
        visible
        fullScreen
        message="Loading profile..."
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      showsVerticalScrollIndicator={false}
    >

      {/* Profile header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              👤
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text
              style={styles.profileName}
              numberOfLines={1}
            >
              {profile.fullName}
            </Text>

            <Text
              style={styles.profileEmail}
              numberOfLines={1}
            >
              {profile.email}
            </Text>
          </View>

          {/* Circular Logout button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutIcon}>
              ↪
            </Text>
          </TouchableOpacity>

        </View>
      </Card>

      {/* Subscription */}
      <Card
        style={styles.subscriptionCard}
      >
        <View
          style={
            styles.subscriptionHeader
          }
        >
          <Text
            style={
              styles.subscriptionTitle
            }
          >
            Subscription
          </Text>

          <View
            style={[
              styles.subscriptionBadge,
              isSubscriptionActive()
                ? styles.activeBadge
                : styles.freeBadge,
            ]}
          >
            <Text
              style={styles.badgeText}
            >
              {currentPlan}
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.subscriptionDescription
          }
        >
          {isSubscriptionActive()
            ? 'You have access to all premium features'
            : 'Upgrade to unlock premium features'}
        </Text>

        <Button
          title={
            isSubscriptionActive()
              ? 'Manage Subscription'
              : 'Upgrade to Pro'
          }
          onPress={() =>
            navigation.navigate(
              'Subscription'
            )
          }
          fullWidth
          style={
            styles.upgradeButton
          }
        />
      </Card>

      {/* Profile information */}
      {!editing ? (
        <Card style={styles.infoCard}>

          <View style={styles.infoHeader}>
            <Text
              style={styles.infoTitle}
            >
              Profile Information
            </Text>

            <TouchableOpacity
              onPress={() =>
                setEditing(true)
              }
            >
              <Text
                style={styles.editButton}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <Text
              style={styles.infoLabel}
            >
              Full Name
            </Text>

            <Text
              style={styles.infoValue}
            >
              {profile.fullName}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text
              style={styles.infoLabel}
            >
              Email
            </Text>

            <Text
              style={styles.infoValue}
            >
              {profile.email}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text
              style={styles.infoLabel}
            >
              Bio
            </Text>

            <Text
              style={styles.infoValue}
            >
              {profile.bio ||
                'No bio added yet'}
            </Text>
          </View>

        </Card>
      ) : (
        <Card style={styles.editCard}>

          <Text style={styles.editTitle}>
            Edit Profile
          </Text>

          <Input
            label="Full Name"
            value={profile.fullName}
            onChangeText={(value) =>
              setProfile({
                ...profile,
                fullName: value,
              })
            }
            placeholder="Enter your full name"
          />

          <Input
            label="Bio"
            value={profile.bio}
            onChangeText={(value) =>
              setProfile({
                ...profile,
                bio: value,
              })
            }
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={3}
          />

          <View
            style={styles.editActions}
          >
            <Button
              title="Save"
              onPress={
                handleUpdateProfile
              }
              loading={loading}
              fullWidth
              style={styles.saveButton}
            />

            <Button
              title="Cancel"
              onPress={() =>
                setEditing(false)
              }
              variant="outline"
              fullWidth
              style={
                styles.cancelButton
              }
            />
          </View>

        </Card>
      )}

      {/* Settings */}
      <Card style={styles.settingsCard}>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() =>
            navigation.navigate(
              'Settings'
            )
          }
        >
          <Text style={styles.settingIcon}>
            ⚙️
          </Text>

          <Text
            style={styles.settingText}
          >
            Settings
          </Text>

          <Text
            style={styles.settingArrow}
          >
            ›
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() =>
            navigation.navigate(
              'ShareTrack'
            )
          }
        >
          <Text style={styles.settingIcon}>
            📤
          </Text>

          <Text
            style={styles.settingText}
          >
            Share with Friends
          </Text>

          <Text
            style={styles.settingArrow}
          >
            ›
          </Text>
        </TouchableOpacity>

      </Card>

      {/* Extra bottom space for floating navigation */}
      <View style={styles.spacer} />

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    padding: 16,
  },

  contentContainer: {
    paddingBottom: 110,
  },

  profileCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor:
      COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  avatarText: {
    fontSize: 40,
  },

  profileInfo: {
    flex: 1,
    minWidth: 0,
  },

  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 4,
  },

  profileEmail: {
    fontSize: 14,
    color: COLORS.gray600,
  },

  /*
   * Circular logout button at the top-right.
   */
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },

  logoutIcon: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
    transform: [
      {
        rotate: '180deg',
      },
    ],
  },

  subscriptionCard: {
    marginBottom: 16,
  },

  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
  },

  subscriptionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  activeBadge: {
    backgroundColor: COLORS.success,
  },

  freeBadge: {
    backgroundColor: COLORS.gray300,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },

  subscriptionDescription: {
    fontSize: 13,
    color: COLORS.gray600,
    marginBottom: 12,
  },

  upgradeButton: {
    marginTop: 8,
  },

  infoCard: {
    marginBottom: 16,
  },

  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
  },

  editButton: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  infoItem: {
    marginBottom: 16,
  },

  infoLabel: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '600',
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 14,
    color: COLORS.gray900,
    fontWeight: '500',
  },

  editCard: {
    marginBottom: 16,
  },

  editTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray900,
    marginBottom: 16,
  },

  editActions: {
    gap: 12,
    marginTop: 16,
  },

  saveButton: {
    marginTop: 8,
  },

  cancelButton: {
    marginTop: 0,
  },

  settingsCard: {
    marginBottom: 16,
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.gray200,
  },

  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  settingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray900,
    flex: 1,
  },

  settingArrow: {
    fontSize: 16,
    color: COLORS.gray400,
  },

  spacer: {
    height: 20,
  },
});

export default ProfileScreen;