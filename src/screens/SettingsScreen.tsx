import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, radii, spacing, typography } from '../theme';
import { Toggle } from '../components/Toggle';
import { Segmented } from '../components/Segmented';
import { Button } from '../components/Button';
import {
  settings, updateSettings, resetProgress, clearHistory,
} from '../store';
import type { Settings } from '../types';
import { BUILD_TAG } from '../buildInfo';

export const SettingsScreen: React.FC = () => {
  const s = settings.use();

  const confirmReset = () =>
    Alert.alert('Reset progress?', 'Clears all completion checkmarks. Logged runs are kept.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetProgress },
    ]);

  const confirmClear = () =>
    Alert.alert('Clear history?', 'Deletes every logged run permanently.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section title="Appearance">
        <Row label="Theme">
          <Segmented<Settings['theme']>
            value={s.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Row>
      </Section>

      <Section title="Audio & haptics">
        <Row label="Interval tones" sub="Beep at every phase change">
          <Toggle value={s.audioEnabled} onChange={(audioEnabled) => updateSettings({ audioEnabled })} />
        </Row>
        <Row label="Tone volume">
          <Slider
            style={{ width: 140 }}
            minimumValue={0}
            maximumValue={1}
            value={s.audioVolume}
            onSlidingComplete={(audioVolume) => updateSettings({ audioVolume })}
            minimumTrackTintColor={colors.run}
            maximumTrackTintColor={colors.bgSubtle}
            thumbTintColor={colors.run}
          />
        </Row>
        <Row label="Vibration" sub="Buzz at phase transitions">
          <Toggle value={s.vibrationEnabled} onChange={(vibrationEnabled) => updateSettings({ vibrationEnabled })} />
        </Row>
      </Section>

      <Section title="Units">
        <Row label="Distance">
          <Segmented<Settings['units']>
            value={s.units}
            onChange={(units) => updateSettings({ units })}
            options={[
              { value: 'km', label: 'km' },
              { value: 'mi', label: 'miles' },
            ]}
          />
        </Row>
      </Section>

      <Section title="During workout">
        <Row label="Keep screen on" sub="Prevent the display from sleeping while a run is in progress">
          <Toggle value={s.keepScreenOn} onChange={(keepScreenOn) => updateSettings({ keepScreenOn })} />
        </Row>
      </Section>

      <Section title="History">
        <Row label="Auto-log completed runs" sub="Prompt for distance after each session">
          <Toggle value={s.autoLogEnabled} onChange={(autoLogEnabled) => updateSettings({ autoLogEnabled })} />
        </Row>
      </Section>

      <Section title="Reminders">
        <Row label="Rest day reminders" sub="Nudge you to lace up">
          <Toggle value={s.restDayReminders} onChange={(restDayReminders) => updateSettings({ restDayReminders })} />
        </Row>
        <Row label="Reminder time">
          <Text style={styles.timeText}>{s.restDayReminderTime}</Text>
        </Row>
      </Section>

      <Section title="Program">
        <Button label="Reset progress" variant="danger" block onPress={confirmReset} />
        <Button label="Clear history"  variant="danger" block onPress={confirmClear} />
      </Section>

      <Text style={styles.build}>Build {BUILD_TAG}</Text>
    </ScrollView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={{ gap: spacing.sm }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Row: React.FC<{ label: string; sub?: string; children: React.ReactNode }> = ({
  label,
  sub,
  children,
}) => (
  <View style={styles.row}>
    <View style={{ flex: 1, marginRight: spacing.md }}>
      <Text style={styles.rowLabel}>{label}</Text>
      {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg },
  sectionTitle: {
    ...typography.tiny, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.md, gap: spacing.md,
  },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowSub: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  timeText: { ...typography.bodyStrong, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  build: {
    ...typography.tiny, color: colors.textTertiary, textAlign: 'center',
    marginTop: spacing.lg, fontVariant: ['tabular-nums'],
  },
});
