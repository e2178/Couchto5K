import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { settingsStore } from './src/stores/settings';
import { historyStore } from './src/stores/history';
import { completionStore } from './src/stores/completion';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      settingsStore.ready,
      historyStore.ready,
      completionStore.ready,
    ]).then(() => setReady(true));
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.bg} />
        {ready ? (
          <RootNavigator />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.run} />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
