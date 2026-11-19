import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '../../utils/colors';
import { Button } from '../../components/common';
import { AdminApplicationForm } from '../../components/admin/AdminApplicationForm';
import { EMPTY_ADMIN_DETAILS, validateAdminApplication } from '../../utils/adminValidators';
import { useUserStore } from '../../store/userStore';
import { useProfileStore } from '../../store/profileStore';
import { adminService } from '../../services/adminService';
import { signOutEverywhere } from '../../utils/session';

const AdminApplicationScreen = () => {
  const user = useUserStore((state) => state.user);
  const { profile, loadProfile, setContinueAsUser, setReapply } = useProfileStore();

  const [details, setDetails] = useState({
    ...EMPTY_ADMIN_DETAILS,
    fullName: profile?.full_name || user?.user_metadata?.full_name || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const validation = validateAdminApplication(details);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setLoading(true);

    const result = await adminService.submitApplication(user.id, details);

    setLoading(false);

    if (!result.success) {
      Alert.alert(
        'Could not send your request',
        'Please check your connection and try again. If this keeps happening, contact support.'
      );
      return;
    }

    setReapply(false);
    await loadProfile(user.id);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🛡️</Text>
          <Text style={styles.title}>Admin application</Text>
          <Text style={styles.subtitle}>
            Complete your details and upload your documents so we can verify you.
          </Text>
        </View>

        <AdminApplicationForm value={details} onChange={setDetails} errors={errors} />

        <Button
          title="Submit for review"
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          size="large"
        />

        <TouchableOpacity style={styles.secondary} onPress={() => setContinueAsUser(true)}>
          <Text style={styles.secondaryText}>Continue as a regular user for now</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondary} onPress={signOutEverywhere}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.gray900, marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray600,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  secondary: { alignItems: 'center', paddingVertical: 14 },
  secondaryText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  signOutText: { color: COLORS.error, fontSize: 14, fontWeight: '700' },
});

export default AdminApplicationScreen;
