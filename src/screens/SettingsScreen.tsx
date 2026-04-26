import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, radii, spacing, typography } from '../theme';
import { Toggle } from '../components/Toggle';
import { Segmented } from '../components/Segmented';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { settingsStore, setSettings } from '../stores/settings';
import { resetCompletion } from '../stores/completion';
import { clearHistory } from '../stores/history';
import type { Settings } from '../types';

type ConfirmKind = 'reset' | 'clear' | null;

export const SettingsScreen: React.FC = () => {
  const settings = settingsStore.use();
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  const onConfirm = () => {
    if (confirm === 'reset') resetCompletion();
    if (confirm === 'clear') clearHistory();
    setConfirm(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section title="Appearance">
        <Row label="Theme">
          <Segmented<Settings['theme']>
            value={settings.theme}
            onChange={(v) => setSettings({ theme: v })}
            options={[
              { value: 'dark',   label: 'Dark' },
              { value: 'light',  label: 'Light' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Row>
      </Section>

      <Section title="Audio & haptics">
        <Row label="Interval tones" sub="Beep at every phase change">
          <Toggle
            value={settings.audioEnabled}
            onChange={(v) => setSettings({ audioEnabled: v })}
          />
        </Row>
        <Row label="Tone volume">
          <View style={{ width: 140 }}>
            <Slider
              minimumValue={0}
              maximumValue={1}
              value={settings.audioVolume}
              onSlidingComplete={(v) => setSettings({ audioVolume: v })}
              minimumTrackTintColor={colors.run}
              maximumTrackTintColor={colors.bgSubtle}
              thumbTintColor={colors.run}
            />
          </View>
        </Row>
        <Row label="Vibration" sub="Buzz at phase transitions">
          <Toggle
            value={settings.vibrationEnabled}
            onChange={(v) => setSettings({ vibrationEnabled: v })}
          />
        </Row>
      </Section>

      <Section title="Units">
        <Row label="Distance">
          <Segmented<Settings['units']>
            value={settings.units}
            onChange={(v) => setSettings({ units: v })}
            options={[
              { value: 'km', label: 'km' },
              { value: 'mi', label: 'miles' },
            ]}
          />
        </Row>
      </Section>

      <Section title="History">
        <Row label="Auto-log completed runs" sub="Prompt for distance after each session">
          <Toggle
            value={settings.autoLogEnabled}
            onChange={(v) => setSettings({ autoLogEnabled: v })}
          />
        </Row>
      </Section>

      <Section title="Reminders">
        <Row label="Rest day reminders" sub="Nudge you to lace up">
          <Toggle
            value={settings.restDayReminders}
            onChange={(v) => setSettings({ restDayReminders: v })}
          />
        </Row>
        <Row label="Reminder time">
          <Text style={styles.timeText}>{settings.restDayReminderTime}</Text>
        </Row>
      </Section>

      <Section title="Program">
        <Button
          label="Reset progress"
          variant="danger"
          block
          onPress={() => setConfirm('reset')}
        />
        <Button
          label="Clear history"
          variant="danger"
          block
          onPress={() => setConfirm('clear')}
        />
      </Section>

      <ConfirmModal
        visible={confirm === 'reset'}
        title="Reset progress?"
        body="Clears all completion checkmarks. Logged runs are kept."
        confirmLabel="Reset progress"
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmModal
        visible={confirm === 'clear'}
        title="Clear history?"
        body="Deletes every logged run permanently."
        confirmLabel="Clear history"
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </ScrollView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
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
  section: { gap: spacing.sm },
  sectionTitle: {
    ...typography.tiny, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.bgSubtle,
    padding: spacing.md,
    gap: spacing.md,
  },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowSub:   { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  timeText: { ...typography.bodyStrong, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
});
