import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../utils/colors';
import { ADMIN } from '../../utils/adminTheme';
import { useUserStore } from '../../store/userStore';
import { useProfileStore } from '../../store/profileStore';
import { signOutEverywhere } from '../../utils/session';
import { supabase } from '../../services/supabaseService';

const AdminStatusScreen = ({ status }) => {
  const user = useUserStore((state) => state.user);
  const { loadProfile, setContinueAsUser, setReapply } = useProfileStore();
  const [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState(null);

  const isRejected = status === 'rejected';

  const refresh = async () => {
    setRefreshing(true);
    await loadProfile(user?.id);
    setRefreshing(false);
  };

  React.useEffect(() => {
    let cancelled = false;

    const loadNote = async () => {
      if (!isRejected) {
        return;
      }
      const { data } = await supabase
        .from('admin_applications')
        .select('review_note')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (!cancelled && data?.review_note) {
        setNote(data.review_note);
      }
    };

    loadNote();

    return () => {
      cancelled = true;
    };
  }, [isRejected, user?.id]);

  return (
    <LinearGradient colors={ADMIN.gradient} style={styles.container}>
      <View style={styles.card}>
        <View style={[styles.badge, isRejected ? styles.badgeRed : styles.badgeAmber]}>
          <Text style={styles.badgeIcon}>{isRejected ? '✕' : '⏳'}</Text>
        </View>

        <Text style={styles.title}>
          {isRejected ? 'Request not approved' : 'Application under review'}
        </Text>

        <Text style={styles.body}>
          {isRejected
            ? 'An administrator reviewed your documents and could not approve this request.'
            : 'Thank you. An administrator is checking your documents. This usually takes a short while, and your account will switch to the admin console as soon as you are approved.'}
        </Text>

        {isRejected && note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Reviewer note</Text>
            <Text style={styles.noteText}>{note}</Text>
          </View>
        ) : null}

        {!isRejected ? (
          <TouchableOpacity style={styles.primary} onPress={refresh} activeOpacity={0.85}>
            {refreshing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryText}>Check status</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primary}
            onPress={() => setReapply(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>Apply again with new documents</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondary} onPress={() => setContinueAsUser(true)}>
          <Text style={styles.secondaryText}>Use MoodSync as a regular user</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondary} onPress={signOutEverywhere}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: ADMIN.card,
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    borderColor: ADMIN.border,
    alignItems: 'center',
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  badgeAmber: {
    backgroundColor: 'rgba(251,191,36,0.18)',
  },
  badgeRed: {
    backgroundColor: 'rgba(248,113,113,0.18)',
  },
  badgeIcon: {
    fontSize: 34,
    color: ADMIN.text,
  },
  title: {
    color: ADMIN.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    color: ADMIN.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  noteBox: {
    alignSelf: 'stretch',
    backgroundColor: ADMIN.bgSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ADMIN.border,
  },
  noteLabel: {
    color: ADMIN.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  noteText: {
    color: ADMIN.text,
    fontSize: 13,
    lineHeight: 19,
  },
  primary: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 14,
    backgroundColor: ADMIN.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  secondary: {
    paddingVertical: 14,
  },
  secondaryText: {
    color: ADMIN.accentLight,
    fontSize: 14,
    fontWeight: '700',
  },
  signOutText: {
    color: ADMIN.red,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AdminStatusScreen;
