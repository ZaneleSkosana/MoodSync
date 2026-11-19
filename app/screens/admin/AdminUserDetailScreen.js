import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { ADMIN } from '../../utils/adminTheme';
import {
  Avatar,
  Pill,
  SectionCard,
  InfoRow,
  ActionButton,
  ReasonModal,
  EmptyState,
} from '../../components/admin/AdminUI';
import { adminService } from '../../services/adminService';
import { useUserStore } from '../../store/userStore';
import { formatDate, formatDateTime } from '../../utils/adminFormat';

const AdminUserDetailScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const me = useUserStore((state) => state.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const result = await adminService.getUser(userId);

    if (result.success && result.data) {
      setData(result.data);
      setError(null);
    } else {
      setError('Could not load this account.');
    }

    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const isSelf = me?.id === userId;

  const applyChange = async (disabled, reason) => {
    setSaving(true);
    const result = await adminService.setUserDisabled(userId, disabled, reason);
    setSaving(false);
    setModalVisible(false);

    if (!result.success) {
      Alert.alert('Action failed', result.error || 'Please try again.');
      return;
    }

    await load();
    Alert.alert(
      disabled ? 'Account disabled' : 'Account enabled',
      disabled
        ? 'This user can no longer sign in.'
        : 'This user can sign in again.'
    );
  };

  const onPressAction = () => {
    if (data.is_disabled) {
      Alert.alert('Enable this account?', `${data.full_name || data.email} will be able to sign in again.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enable', onPress: () => applyChange(false, null) },
      ]);
      return;
    }

    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={ADMIN.accentLight} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <EmptyState icon="⚠️" title="Account unavailable" body={error} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={data.is_disabled ? ['#450A0A', '#7F1D1D'] : ADMIN.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Avatar name={data.full_name} email={data.email} size={72} color="rgba(255,255,255,0.22)" />
          <Text style={styles.name}>{data.full_name || 'No name'}</Text>
          <Text style={styles.email}>{data.email}</Text>
          <View style={styles.pills}>
            {data.role === 'admin' ? <Pill label="ADMIN" tone="amber" /> : <Pill label="USER" tone="cyan" />}
            {data.is_disabled ? <Pill label="DISABLED" tone="red" /> : <Pill label="ACTIVE" tone="green" />}
            {data.plan_name ? <Pill label={data.plan_name.toUpperCase()} tone="indigo" /> : null}
          </View>
        </LinearGradient>

        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text style={styles.tileValue}>{Number(data.mood_checkins) || 0}</Text>
            <Text style={styles.tileLabel}>Mood check-ins</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileValue}>{Number(data.playlists) || 0}</Text>
            <Text style={styles.tileLabel}>Playlists</Text>
          </View>
        </View>

        <SectionCard title="Account details">
          <InfoRow label="Joined" value={formatDate(data.created_at)} />
          <InfoRow label="Role" value={data.role === 'admin' ? 'Administrator' : 'Regular user'} />
          <InfoRow
            label="Status"
            value={data.is_disabled ? 'Disabled' : 'Active'}
            tone={data.is_disabled ? 'red' : 'green'}
          />
          <InfoRow label="Plan" value={data.plan_name ? `${data.plan_name} (${data.plan_duration || 'Monthly'})` : 'Free'} />
          {data.next_billing_date ? (
            <InfoRow label="Next billing" value={formatDate(data.next_billing_date)} />
          ) : null}
          <InfoRow label="Account ID" value={String(data.id).slice(0, 8)} />
        </SectionCard>

        {data.is_disabled ? (
          <SectionCard title="Why it was disabled">
            <Text style={styles.reason}>{data.disabled_reason || 'No reason was recorded.'}</Text>
            <Text style={styles.reasonMeta}>Disabled on {formatDateTime(data.disabled_at)}</Text>
          </SectionCard>
        ) : null}

        {isSelf ? (
          <Text style={styles.selfNote}>This is your own account, so its status cannot be changed here.</Text>
        ) : (
          <ActionButton
            title={data.is_disabled ? 'Enable account' : 'Disable account'}
            tone={data.is_disabled ? 'success' : 'danger'}
            onPress={onPressAction}
            loading={saving}
          />
        )}
      </ScrollView>

      <ReasonModal
        visible={modalVisible}
        title="Disable this account?"
        message="The user is signed out right away and cannot sign in until you enable the account again."
        placeholder="Reason (required)"
        confirmLabel="Disable"
        tone="danger"
        required
        loading={saving}
        onCancel={() => setModalVisible(false)}
        onConfirm={(reason) => applyChange(true, reason)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN.bg,
  },
  center: {
    flex: 1,
    backgroundColor: ADMIN.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
    borderRadius: 24,
    padding: 24,
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
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tiles: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  tile: {
    flex: 1,
    backgroundColor: ADMIN.card,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: ADMIN.border,
  },
  tileValue: {
    color: ADMIN.text,
    fontSize: 28,
    fontWeight: '800',
  },
  tileLabel: {
    color: ADMIN.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  reason: {
    color: ADMIN.text,
    fontSize: 14,
    lineHeight: 20,
  },
  reasonMeta: {
    color: ADMIN.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  selfNote: {
    color: ADMIN.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AdminUserDetailScreen;
