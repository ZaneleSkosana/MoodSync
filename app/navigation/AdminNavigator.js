import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ADMIN, ADMIN_TABS } from '../utils/adminTheme';
import { TopTabBar } from '../components/navigation/TopTabBar';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminUserDetailScreen from '../screens/admin/AdminUserDetailScreen';
import AdminApplicationsScreen from '../screens/admin/AdminApplicationsScreen';
import AdminApplicationDetailScreen from '../screens/admin/AdminApplicationDetailScreen';
import AdminAccountScreen from '../screens/admin/AdminAccountScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: ADMIN.bg },
  headerTintColor: ADMIN.text,
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
};

const UsersStack = () => (
  <Stack.Navigator screenOptions={stackOptions}>
    <Stack.Screen
      name="UsersList"
      component={AdminUsersScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="UserDetail"
      component={AdminUserDetailScreen}
      options={{ title: 'Account' }}
    />
  </Stack.Navigator>
);

const ApplicationsStack = () => (
  <Stack.Navigator screenOptions={stackOptions}>
    <Stack.Screen
      name="ApplicationsList"
      component={AdminApplicationsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ApplicationDetail"
      component={AdminApplicationDetailScreen}
      options={{ title: 'Admin request' }}
    />
  </Stack.Navigator>
);

export const AdminNavigator = () => (
  <Tab.Navigator
    tabBar={() => null}
    sceneContainerStyle={{ backgroundColor: ADMIN.bg }}
    screenOptions={{
      headerShown: true,
      headerStatusBarHeight: 0,
      header: ({ navigation }) => (
        <TopTabBar tabs={ADMIN_TABS} navigation={navigation} variant="admin" />
      ),
    }}
  >
    <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
    <Tab.Screen name="Users" component={UsersStack} />
    <Tab.Screen name="Applications" component={ApplicationsStack} />
    <Tab.Screen name="Account" component={AdminAccountScreen} />
  </Tab.Navigator>
);

export default AdminNavigator;
