import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { NavigationContainer, DarkTheme, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../theme';
import { ProgramScreen } from '../screens/ProgramScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { SessionContext } from '../types';

type RootStack = { Tabs: undefined; Settings: undefined };
type Tabs = { Program: undefined; Workout: undefined; History: undefined };

const Stack = createNativeStackNavigator<RootStack>();
const Tab = createBottomTabNavigator<Tabs>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    border: colors.bgSubtle,
    primary: colors.run,
    text: colors.textPrimary,
  },
};

const TAB_GLYPHS: Record<keyof Tabs, string> = {
  Program: '▦',
  Workout: '▶',
  History: '⟳',
};

const SettingsButton: React.FC = () => {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate('Settings')}
      hitSlop={8}
      style={{ paddingHorizontal: 12 }}
    >
      <Text style={{ fontSize: 22, color: colors.textSecondary }}>⚙</Text>
    </Pressable>
  );
};

const TabsNav: React.FC<{
  pendingCtx: SessionContext | null;
  onPendingConsumed: () => void;
  onStart: (ctx: SessionContext) => void;
  onRunLogged: () => void;
}> = ({ pendingCtx, onPendingConsumed, onStart, onRunLogged }) => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: colors.bg },
      headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
      headerShadowVisible: false,
      headerRight: () => <SettingsButton />,
      tabBarStyle: {
        backgroundColor: colors.bgElevated,
        borderTopColor: colors.bgSubtle,
      },
      tabBarActiveTintColor: colors.run,
      tabBarInactiveTintColor: colors.textTertiary,
      tabBarIcon: ({ color }) => (
        <Text style={{ fontSize: 18, color }}>
          {TAB_GLYPHS[route.name as keyof Tabs]}
        </Text>
      ),
      tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
    })}
  >
    <Tab.Screen name="Program">
      {() => <ProgramScreen onStart={onStart} />}
    </Tab.Screen>
    <Tab.Screen name="Workout">
      {() => (
        <WorkoutScreen
          pendingCtx={pendingCtx}
          onPendingConsumed={onPendingConsumed}
          onRunLogged={onRunLogged}
        />
      )}
    </Tab.Screen>
    <Tab.Screen name="History" component={HistoryScreen} />
  </Tab.Navigator>
);

export const RootNavigator: React.FC = () => {
  const [pendingCtx, setPendingCtx] = useState<SessionContext | null>(null);
  const navRef = React.useRef<any>(null);

  return (
    <NavigationContainer ref={navRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
        }}
      >
        <Stack.Screen name="Tabs" options={{ headerShown: false }}>
          {() => (
            <TabsNav
              pendingCtx={pendingCtx}
              onPendingConsumed={() => setPendingCtx(null)}
              onStart={(ctx) => {
                setPendingCtx(ctx);
                navRef.current?.navigate('Tabs', { screen: 'Workout' });
              }}
              onRunLogged={() =>
                navRef.current?.navigate('Tabs', { screen: 'History' })
              }
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
