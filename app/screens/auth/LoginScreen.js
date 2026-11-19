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
import { validateLogin } from '../../utils/validators';
import { useUserStore } from '../../store/userStore';
import { supabaseService } from '../../services/supabaseService';
import { profileService } from '../../services/profileService';
import { getFriendlyAuthError } from '../../utils/authMessages';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { setUser, setError } = useUserStore();

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    const validation = validateLogin({ email: cleanEmail, password });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await supabaseService.auth.signIn(cleanEmail, password);

      if (result.success && result.data?.user) {
        await profileService.ensureProfile(result.data.user);
        setUser(result.data.user);
      } else {
        const message = getFriendlyAuthError(result.error || 'Login failed. Please try again.');
        setError(message);
        Alert.alert('Sign in failed', message);
      }
    } catch (error) {
      const message = getFriendlyAuthError(error.message);
      setError(message);
      Alert.alert('Sign in failed', message);
    } finally {
      setLoading(false);
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
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🎵</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your MoodSync account</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            icon="✉️"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Password"
            icon="🔒"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPasswordLink}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="large"
          />

          <Text style={styles.orText}>Don't have an account?</Text>

          <Button
            title="Sign Up"
            onPress={() => navigation.navigate('SignUp')}
            variant="outline"
            fullWidth
            size="large"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  logo: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.gray900, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.gray600, textAlign: 'center' },
  form: { marginBottom: 24 },
  forgotPasswordLink: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  orText: { color: COLORS.gray600, fontSize: 14, textAlign: 'center', marginTop: 20, marginBottom: 12 },
});

export default LoginScreen;