import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DarkTheme, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors, spacing, typography } from '../theme';
import { ProgramScreen } from '../screens/ProgramScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { SessionContext } from '../types';

export type TabParamList = {
  Program: undefined;
  Workout: undefined;
  History: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

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

const SettingsButton: React.FC = () => {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate('Settings')}
      style={({ pressed }) => [styles.gearBtn, pressed && { opacity: 0.7 }]}
      accessibilityLabel="Settings"
    >
      <Text style={styles.gearGlyph}>⚙</Text>
    </Pressable>
  );
};

const TabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => (
  <View style={styles.tabBar}>
    {state.routes.map((route, index) => {
      const focused = state.index === index;
      const glyph = TAB_GLYPH[route.name as keyof typeof TAB_GLYPH] ?? '•';
      return (
        <Pressable
          key={route.key}
          onPress={() => navigation.navigate(route.name as any)}
          style={styles.tabBtn}
        >
          <Text style={[styles.tabGlyph, focused && styles.tabGlyphActive]}>
            {glyph}
          </Text>
          <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
            {route.name}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const TAB_GLYPH = {
  Program: '▦',
  Workout: '▶',
  History: '⟳',
} as const;

const Tabs: React.FC<{
  pendingCtx: SessionContext | null;
  onPendingConsumed: () => void;
  onStartFromProgram: (ctx: SessionContext) => void;
  onRunLogged: () => void;
}> = ({ pendingCtx, onPendingConsumed, onStartFromProgram, onRunLogged }) => (
  <Tab.Navigator
    tabBar={(props) => <TabBar {...props} />}
    screenOptions={{
      headerStyle: { backgroundColor: colors.bg },
      headerTintColor: colors.textPrimary,
      headerTitleStyle: { fontWeight: '700' },
      headerRight: () => <SettingsButton />,
      headerShadowVisible: false,
    }}
  >
    <Tab.Screen name="Program">
      {() => <ProgramScreen onStart={onStartFromProgram} />}
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
    <Tab.Screen name="History">
      {() => <HistoryScreen />}
    </Tab.Screen>
  </Tab.Navigator>
);

export const RootNavigator: React.FC = () => {
  const [pendingCtx, setPendingCtx] = useState<SessionContext | null>(null);
  const navRef = React.useRef<any>(null);

  const handleStartFromProgram = (ctx: SessionContext) => {
    setPendingCtx(ctx);
    navRef.current?.navigate('Tabs', { screen: 'Workout' });
  };

  const handleRunLogged = () => {
    navRef.current?.navigate('Tabs', { screen: 'History' });
  };

  return (
    <NavigationContainer ref={navRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Tabs" options={{ headerShown: false }}>
          {() => (
            <Tabs
              pendingCtx={pendingCtx}
              onPendingConsumed={() => setPendingCtx(null)}
              onStartFromProgram={handleStartFromProgram}
              onRunLogged={handleRunLogged}
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

const styles = StyleSheet.create({
  gearBtn: { padding: spacing.sm, marginRight: spacing.xs },
  gearGlyph: { fontSize: 20, color: colors.textSecondary },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1, borderTopColor: colors.bgSubtle,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  tabBtn: {
    flex: 1, alignItems: 'center', gap: 2,
  },
  tabGlyph: { fontSize: 20, color: colors.textTertiary },
  tabGlyphActive: { color: colors.run },
  tabLabel: { ...typography.tiny, color: colors.textTertiary, fontWeight: '600' },
  tabLabelActive: { color: colors.run },
});
