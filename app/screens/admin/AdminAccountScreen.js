import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ADMIN } from '../../utils/adminTheme';
import { Avatar, Pill, SectionCard, InfoRow, ActionButton } from '../../components/admin/AdminUI';
import { useUserStore } from '../../store/userStore';
import { useProfileStore } from '../../store/profileStore';
import { signOutEverywhere } from '../../utils/session';
import { formatDate } from '../../utils/adminFormat';

const AdminAccountScreen = () => {
  const user = useUserStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);

  const name = profile?.full_name || user?.user_metadata?.full_name || 'Administrator';

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out of the admin console?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOutEverywhere },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={ADMIN.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Avatar name={name} email={user?.email} size={76} color="rgba(255,255,255,0.22)" />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Pill label="ADMINISTRATOR" tone="amber" />
      </LinearGradient>

      <SectionCard title="Your account">
        <InfoRow label="Role" value="Administrator" />
        <InfoRow label="Member since" value={formatDate(profile?.created_at || user?.created_at)} />
        <InfoRow label="Account ID" value={String(user?.id || '').slice(0, 8)} />
      </SectionCard>

      <SectionCard title="Admin responsibilities">
        <Text style={styles.line}>• Only disable accounts when there is a clear reason.</Text>
        <Text style={styles.line}>• Check ID and proof documents carefully before approving admins.</Text>
        <Text style={styles.line}>• Every disable, enable, approval and rejection is recorded in the activity log.</Text>
      </SectionCard>

      <ActionButton title="Sign out" tone="danger" onPress={confirmSignOut} />

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN.bg,
  },
  content: {
    padding: 16,
  },
  hero: {
    alignItems: 'center',
    borderRadius: 24,
    padding: 26,
    marginBottom: 14,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  email: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  line: {
    color: ADMIN.textMuted,
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 4,
  },
  spacer: {
    height: 40,
  },
});

export default AdminAccountScreen;
