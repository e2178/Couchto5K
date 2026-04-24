import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

import { theme } from './src/theme';
import { CompletionProvider } from './src/context/Completion';
import { HistoryProvider } from './src/context/History';
import { SelectedRunProvider } from './src/context/SelectedRun';
import PlanScreen from './src/screens/PlanScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import HistoryScreen from './src/screens/HistoryScreen';

export type RootTabs = {
  Plan: undefined;
  Workout: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<RootTabs>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: theme.bg,
    card: theme.bgElevated,
    text: theme.text,
    border: theme.border,
    primary: theme.accent,
    notification: theme.accent,
  },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View
      style={{
        minWidth: 28,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 18,
          color: focused ? theme.accent : theme.muted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CompletionProvider>
          <HistoryProvider>
            <SelectedRunProvider>
              <NavigationContainer theme={navTheme}>
                <StatusBar style="light" />
                <Tab.Navigator
                  screenOptions={{
                    tabBarActiveTintColor: theme.accent,
                    tabBarInactiveTintColor: theme.muted,
                    tabBarStyle: {
                      backgroundColor: theme.bgElevated,
                      borderTopColor: theme.border,
                    },
                    headerStyle: { backgroundColor: theme.bgElevated },
                    headerTitleStyle: { color: theme.text, fontWeight: '700' },
                    headerTintColor: theme.text,
                  }}
                >
                  <Tab.Screen
                    name="Plan"
                    component={PlanScreen}
                    options={{
                      title: 'Program',
                      tabBarIcon: ({ focused }) => (
                        <TabIcon label="▤" focused={focused} />
                      ),
                    }}
                  />
                  <Tab.Screen
                    name="Workout"
                    component={WorkoutScreen}
                    options={{
                      title: 'Workout',
                      tabBarIcon: ({ focused }) => (
                        <TabIcon label="▶" focused={focused} />
                      ),
                    }}
                  />
                  <Tab.Screen
                    name="History"
                    component={HistoryScreen}
                    options={{
                      title: 'History',
                      tabBarIcon: ({ focused }) => (
                        <TabIcon label="◷" focused={focused} />
                      ),
                    }}
                  />
                </Tab.Navigator>
              </NavigationContainer>
            </SelectedRunProvider>
          </HistoryProvider>
        </CompletionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
