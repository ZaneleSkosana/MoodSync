import React from 'react';

import {
  View,
  StyleSheet,
} from 'react-native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import { COLORS } from '../utils/colors';

import HomeScreen from '../screens/main/HomeScreen';
import MoodDetectionScreen from '../screens/main/MoodDetectionScreen';
import CalibrationScreen from '../screens/main/CalibrationScreen';
import MoodSelectionScreen from '../screens/main/MoodSelectionScreen';
import SetMoodGoalScreen from '../screens/main/SetMoodGoalScreen';
import MoodPlaylistScreen from '../screens/main/MoodPlaylistScreen';
import SearchScreen from '../screens/main/SearchScreen';
import PlaylistScreen from '../screens/main/PlaylistScreen';
import PlaylistDetailScreen from '../screens/main/PlaylistDetailScreen';
import LibraryScreen from '../screens/main/LibraryScreen';
import MoodHistoryScreen from '../screens/main/MoodHistoryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ShareTrackScreen from '../screens/settings/ShareTrackScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import PaymentScreen from '../screens/subscription/PaymentScreen';
import SubscriptionSuccessScreen from '../screens/subscription/SubscriptionSuccessScreen';
import MoodInsightsScreen from '../screens/main/MoodInsightsScreen';
import PremiumCollectionsScreen from '../screens/main/PremiumCollectionsScreen';
import NowPlayingScreen from '../screens/main/NowPlayingScreen';

import MiniPlayer from '../components/playlist/MiniPlayer';
import { TopTabBar } from '../components/navigation/TopTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        animation: 'fade',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="HomeStack"
        component={HomeScreen}
        options={{
          title: 'MoodSync',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="MoodDetection"
        component={MoodDetectionScreen}
        options={{
          title: 'Detect Mood',
        }}
      />

      <Stack.Screen
        name="MoodSelection"
        component={MoodSelectionScreen}
        options={{
          title: 'Select Mood',
        }}
      />

      <Stack.Screen
        name="Calibration"
        component={CalibrationScreen}
        options={{
          title: 'Personalize Detection',
        }}
      />

      <Stack.Screen
        name="SetMoodGoal"
        component={SetMoodGoalScreen}
        options={{
          title: 'Set a Goal',
          headerShown: false,
        }}
      />
<Stack.Screen
        name="MoodPlaylist"
        component={MoodPlaylistScreen}
        options={{
          title: 'Your Playlist',
        }}
      />
     
    </Stack.Navigator>
  );
};

const SearchStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      animation: 'fade',
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 18,
      },
    }}
  >
    <Stack.Screen
      name="SearchStack"
      component={SearchScreen}
      options={{
        title: 'Search',
      }}
    />
  </Stack.Navigator>
);

const PlaylistStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      animation: 'fade',
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 18,
      },
    }}
  >
    <Stack.Screen
      name="PlaylistStack"
      component={PlaylistScreen}
      options={{
        title: 'Playlists',
      }}
    />
    <Stack.Screen
      name="PlaylistDetail"
      component={PlaylistDetailScreen}
      options={({ route }) => ({
        title: route.params?.playlist?.name || 'Playlist',
      })}
    />
  </Stack.Navigator>
);

const LibraryStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      animation: 'fade',
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 18,
      },
    }}
  >
    <Stack.Screen
      name="LibraryStack"
      component={LibraryScreen}
      options={{
        title: 'Library',
      }}
    />

    <Stack.Screen
      name="MoodHistory"
      component={MoodHistoryScreen}
      options={{
        title: 'Mood History',
      }}
    />
  </Stack.Navigator>
);

const ProfileStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      animation: 'fade',
      headerStyle: {
        backgroundColor: COLORS.primary,
      },
      headerTintColor: COLORS.white,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 18,
      },
    }}
  >
    <Stack.Screen
      name="ProfileStack"
      component={ProfileScreen}
      options={{
        title: 'Profile',
      }}
    />

    <Stack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        title: 'Settings',
      }}
    />

    <Stack.Screen
      name="ShareTrack"
      component={ShareTrackScreen}
      options={{
        title: 'Share Track',
      }}
    />

    <Stack.Screen
      name="Subscription"
      component={SubscriptionScreen}
      options={{
        title: 'Subscription',
      }}
    />

    <Stack.Screen
      name="Payment"
      component={PaymentScreen}
      options={{
        title: 'Payment',
      }}
    />

    <Stack.Screen
      name="SubscriptionSuccess"
      component={SubscriptionSuccessScreen}
      options={{
        headerShown: false,
        gestureEnabled: false,
      }}
    />

    <Stack.Screen
      name="MoodInsights"
      component={MoodInsightsScreen}
      options={{
        title: 'Mood Insights',
      }}
    />

    <Stack.Screen
      name="PremiumCollections"
      component={PremiumCollectionsScreen}
      options={{
        title: 'Premium Collections',
      }}
    />
  </Stack.Navigator>
);

const tabs = [
  { name: 'Home', label: 'Home', icon: '🏠' },
  { name: 'Search', label: 'Search', icon: '🔍' },
  { name: 'Playlists', label: 'Playlists', icon: '🎵' },
  { name: 'Library', label: 'Library', icon: '📚' },
  { name: 'Profile', label: 'Profile', icon: '👤' },
];

const MainTabs = () => {
  return (
    <View style={styles.navigatorContainer}>
      <Tab.Navigator
        tabBar={() => null}
        screenOptions={{
          headerShown: true,
          headerStatusBarHeight: 0,
          header: ({ navigation }) => (
            <TopTabBar
              tabs={tabs}
              navigation={navigation}
              variant="user"
            />
          ),
        }}
      >
        <Tab.Screen
          name="Home"
          component={
            HomeStackNavigator
          }
        />

        <Tab.Screen
          name="Search"
          component={
            SearchStackNavigator
          }
        />

        <Tab.Screen
          name="Playlists"
          component={
            PlaylistStackNavigator
          }
        />

        <Tab.Screen
          name="Library"
          component={
            LibraryStackNavigator
          }
        />

        <Tab.Screen
          name="Profile"
          component={
            ProfileStackNavigator
          }
        />
      </Tab.Navigator>

      <MiniPlayer />
    </View>
  );
};

const MainNavigator = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabs} />
      <RootStack.Screen
        name="NowPlaying"
        component={NowPlayingScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
    </RootStack.Navigator>
  );
};

const styles = StyleSheet.create({
  navigatorContainer: {
    flex: 1,
  },
});

export { MainNavigator };

export default MainNavigator;