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
import { Button, Input } from '../../components/common';
import { AdminApplicationForm } from '../../components/admin/AdminApplicationForm';
import { validateSignUp } from '../../utils/validators';
import { EMPTY_ADMIN_DETAILS, validateAdminApplication } from '../../utils/adminValidators';
import { useUserStore } from '../../store/userStore';
import { useProfileStore } from '../../store/profileStore';
import { adminService } from '../../services/adminService';
import { profileService } from '../../services/profileService';
import { getFriendlyAuthError } from '../../utils/authMessages';

const ROLE_OPTIONS = [
  {
    id: 'user',
    icon: '🎧',
    title: 'Regular user',
    description: 'Discover music for your mood',
  },
  {
    id: 'admin',
    icon: '🛡️',
    title: 'Administrator',
    description: 'Manage users and the platform',
  },
];

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [role, setRole] = useState('user');
  const [adminDetails, setAdminDetails] = useState(EMPTY_ADMIN_DETAILS);
  const [errors, setErrors] = useState({});
  const [adminErrors, setAdminErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { setUser, setError } = useUserStore();
  const { setBusy, loadProfile } = useProfileStore();

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isAdmin = role === 'admin';

  const handleSignUp = async () => {
    const cleanData = {
      ...formData,
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
    };

    const validation = validateSignUp(cleanData);
    const adminValidation = isAdmin
      ? validateAdminApplication(adminDetails)
      : { isValid: true, errors: {} };

    if (!validation.isValid || !adminValidation.isValid) {
      setErrors(validation.errors || {});
      setAdminErrors(adminValidation.errors || {});
      return;
    }

    setErrors({});
    setAdminErrors({});
    setLoading(true);

    if (isAdmin) {
      setBusy(true);
    }

    try {
      const result = await adminService.signUpWithRole(
        cleanData.email,
        cleanData.password,
        cleanData.fullName,
        role
      );

      if (!result.success) {
        const message = getFriendlyAuthError(result.error);
        setError(message);
        Alert.alert('Sign up failed', message);
        return;
      }

      const newUser = result.data?.user;

      if (newUser && Array.isArray(newUser.identities) && newUser.identities.length === 0) {
        Alert.alert(
          'Account already exists',
          'An account with this email already exists. Please sign in instead.',
          [{ text: 'Go to Sign In', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }

      if (!result.data?.session) {
        Alert.alert(
          'Account created',
          isAdmin
            ? 'We sent a confirmation link to your email. Confirm your email, sign in, and you will be asked to upload your admin documents again.'
            : 'We sent a confirmation link to your email. Confirm your email, then sign in.',
          [{ text: 'Go to Sign In', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }

      await profileService.ensureProfile(newUser, cleanData.fullName);

      if (isAdmin) {
        const submitted = await adminService.submitApplication(newUser.id, adminDetails);

        if (!submitted.success) {
          Alert.alert(
            'Account created',
            'Your account was created but your admin documents could not be sent. You can upload them again on the next screen.'
          );
        }

        await loadProfile(newUser.id);
      }

      setUser(newUser);
    } catch (error) {
      const message = getFriendlyAuthError(error.message);
      setError(message);
      Alert.alert('Sign up failed', message);
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🎵</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join MoodSync and discover music for your mood</Text>
        </View>

        <Text style={styles.sectionLabel}>I want to sign up as</Text>
        <View style={styles.roleRow}>
          {ROLE_OPTIONS.map((option) => {
            const selected = role === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.roleCard, selected && styles.roleCardSelected]}
                onPress={() => setRole(option.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.roleIcon}>{option.icon}</Text>
                <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>
                  {option.title}
                </Text>
                <Text style={styles.roleDescription}>{option.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            icon="👤"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChangeText={(value) => updateFormData('fullName', value)}
            error={errors.fullName}
          />

          <Input
            label="Email"
            icon="✉️"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Password"
            icon="🔒"
            placeholder="Create a password"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            icon="🔒"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            secureTextEntry
            error={errors.confirmPassword}
          />

          {isAdmin ? (
            <AdminApplicationForm
              value={adminDetails}
              onChange={setAdminDetails}
              errors={adminErrors}
            />
          ) : null}

          <Button
            title={isAdmin ? 'Submit Admin Request' : 'Create Account'}
            onPress={handleSignUp}
            loading={loading}
            fullWidth
            size="large"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24 },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  logo: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.gray900, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.gray600, textAlign: 'center', paddingHorizontal: 20 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray800,
    marginBottom: 10,
  },
  roleRow: { flexDirection: 'row', marginBottom: 22 },
  roleCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
    marginRight: 10,
  },
  roleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.gray50,
  },
  roleIcon: { fontSize: 26, marginBottom: 8 },
  roleTitle: { fontSize: 15, fontWeight: '800', color: COLORS.gray800, marginBottom: 2 },
  roleTitleSelected: { color: COLORS.primary },
  roleDescription: { fontSize: 12, color: COLORS.gray600, lineHeight: 17 },
  form: { marginBottom: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto' },
  footerText: { color: COLORS.gray600, fontSize: 14 },
  signInLink: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});

export default SignUpScreen;
