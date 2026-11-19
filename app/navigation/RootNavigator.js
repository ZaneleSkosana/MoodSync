import React, { useEffect, useState } from 'react';
import { Alert, AppState, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useUserStore } from '../store/userStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useProfileStore } from '../store/profileStore';
import { supabaseService } from '../services/supabaseService';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { AdminNavigator } from './AdminNavigator';
import { BrandedLoading } from '../components/common/BrandedLoading';
import AdminApplicationScreen from '../screens/admin/AdminApplicationScreen';
import AdminStatusScreen from '../screens/admin/AdminStatusScreen';
import { getAccountRoute } from '../utils/adminValidators';
import { signOutEverywhere } from '../utils/session';

const PROFILE_REFRESH_MS = 45000;

export const RootNavigator = () => {
  const { user, setUser, clearUser, setLoading } = useUserStore();
  const profile = useProfileStore((state) => state.profile);
  const profileLoaded = useProfileStore((state) => state.loaded);
  const busy = useProfileStore((state) => state.busy);
  const continueAsUser = useProfileStore((state) => state.continueAsUser);
  const reapply = useProfileStore((state) => state.reapply);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAsync = async () => {
      try {
        setLoading(true);
        const result = await supabaseService.auth.getCurrentUser();
        if (isMounted && result.success && result.data) {
          setUser(result.data);
        }
      } catch (error) {
        console.error('Error restoring user:', error);
      } finally {
        if (isMounted) {
          setInitializing(false);
          setLoading(false);
        }
      }
    };

    bootstrapAsync();
    const { data: authListener } = supabaseService.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          clearUser();
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      useSubscriptionStore.getState().loadSubscription(user.id);
      useProfileStore.getState().loadProfile(user.id);
    } else {
      useSubscriptionStore.getState().clearSubscription();
      useProfileStore.getState().clearProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    const refresh = () => useProfileStore.getState().loadProfile(user.id);

    const interval = setInterval(refresh, PROFILE_REFRESH_MS);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refresh();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [user?.id]);

  const route = getAccountRoute(profile, { continueAsUser, reapply });

  useEffect(() => {
    if (user && route === 'disabled') {
      Alert.alert(
        'Account disabled',
        'This account has been disabled by an administrator. Please contact support if you think this is a mistake.'
      );
      signOutEverywhere();
    }
  }, [route, user]);

  if (initializing) {
    return <BrandedLoading />;
  }

  const renderContent = () => {
    if (!user) {
      return <AuthNavigator />;
    }

    if (!profileLoaded || route === 'disabled') {
      return <BrandedLoading />;
    }

    if (route === 'admin') {
      return <AdminNavigator />;
    }

    if (route === 'application') {
      return <AdminApplicationScreen />;
    }

    if (route === 'pending' || route === 'rejected') {
      return <AdminStatusScreen status={route} />;
    }

    return <MainNavigator />;
  };

  return (
    <View style={styles.root}>
      <NavigationContainer>{renderContent()}</NavigationContainer>
      {busy ? (
        <View style={StyleSheet.absoluteFill}>
          <BrandedLoading />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
