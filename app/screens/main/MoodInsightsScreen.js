import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../utils/colors';
import { useMoodStore } from '../../store/moodStore';
import { useSubscriptionStore, selectIsPremium } from '../../store/subscriptionStore';
import { computeInsights } from '../../utils/moodInsights';

const PERIODS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: 'All time', days: 0 },
];

const MoodInsightsScreen = ({ navigation }) => {
  const [periodIndex, setPeriodIndex] = useState(1);
  const moodHistory = useMoodStore((state) => state.moodHistory);
  const isPremium = useSubscriptionStore(selectIsPremium);

  const insights = useMemo(
    () => computeInsights(moodHistory, PERIODS[periodIndex].days),
    [moodHistory, periodIndex]
  );

  const maxWeekly = Math.max(1, ...insights.weekly.map((day) => day.count));

  if (!isPremium) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.lockedContent}>
        <View style={styles.lockedIconWrap}>
          <Text style={styles.lockedIcon}>📊</Text>
        </View>
        <Text style={styles.lockedTitle}>Mood Insights is a Premium feature</Text>
        <Text style={styles.lockedBody}>
          See your mood patterns, daily streaks, favourite times of day and how long you listen,
          all in one place.
        </Text>

        <View style={styles.previewCard}>
          <Text style={styles.previewHeading}>What you will see</Text>
          {[
            'Your most frequent mood and how it changes',
            'Mood breakdown with percentages',
            'Morning, afternoon, evening and night patterns',
            'Check-in streak and weekly activity',
            'Total listening minutes',
          ].map((line) => (
            <View key={line} style={styles.previewRow}>
              <Text style={styles.previewCheck}>✓</Text>
              <Text style={styles.previewText}>{line}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.85}
        >
          <Text style={styles.upgradeButtonText}>See Premium plans</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <LinearGradient colors={GRADIENTS.moodGradient} style={styles.hero}>
        <Text style={styles.heroLabel}>YOUR MOOD INSIGHTS</Text>
        <Text style={styles.heroSummary}>{insights.summary}</Text>
      </LinearGradient>

      <View style={styles.periodRow}>
        {PERIODS.map((period, index) => (
          <TouchableOpacity
            key={period.label}
            style={[styles.periodChip, periodIndex === index && styles.periodChipActive]}
            onPress={() => setPeriodIndex(index)}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.periodText, periodIndex === index && styles.periodTextActive]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tiles}>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{insights.total}</Text>
          <Text style={styles.tileLabel}>Check-ins</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>
            {insights.topMood ? insights.topMood.emoji : '–'}
          </Text>
          <Text style={styles.tileLabel}>
            {insights.topMood ? insights.topMood.label : 'Top mood'}
          </Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{insights.streak}</Text>
          <Text style={styles.tileLabel}>Day streak</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{insights.minutesListened}</Text>
          <Text style={styles.tileLabel}>Minutes</Text>
        </View>
      </View>

      {insights.total === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🙂</Text>
          <Text style={styles.emptyTitle}>No moods in this period yet</Text>
          <Text style={styles.emptyBody}>
            Pick an emoji and play a song to start building your insights.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Home', { screen: 'MoodSelection' })}
            activeOpacity={0.85}
          >
            <Text style={styles.upgradeButtonText}>Pick a mood</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mood breakdown</Text>
            {insights.distribution.map((item) => (
              <View key={item.label} style={styles.barRow}>
                <Text style={styles.barEmoji}>{item.emoji}</Text>
                <View style={styles.barBody}>
                  <View style={styles.barTop}>
                    <Text style={styles.barLabel}>{item.label}</Text>
                    <Text style={styles.barPercent}>
                      {item.percent}%  ·  {item.count}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.max(item.percent, 4)}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Time of day</Text>
            <View style={styles.bucketGrid}>
              {insights.buckets.map((bucket) => (
                <View key={bucket.name} style={styles.bucket}>
                  <Text style={styles.bucketEmoji}>{bucket.emoji || '·'}</Text>
                  <Text style={styles.bucketName}>{bucket.name}</Text>
                  <Text style={styles.bucketMood}>
                    {bucket.topMood || 'No data'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last 7 days</Text>
        <View style={styles.weekRow}>
          {insights.weekly.map((day) => (
            <View key={day.key} style={styles.weekCol}>
              <View style={styles.weekTrack}>
                <View
                  style={[
                    styles.weekFill,
                    { height: `${Math.max((day.count / maxWeekly) * 100, day.count ? 12 : 0)}%` },
                  ]}
                />
              </View>
              <Text style={styles.weekCount}>{day.count}</Text>
              <Text style={styles.weekDay}>{day.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  content: {
    paddingBottom: 24,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.85,
    marginBottom: 10,
  },
  heroSummary: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  periodRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginRight: 8,
  },
  periodChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  periodTextActive: {
    color: COLORS.white,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    marginTop: 12,
  },
  tile: {
    width: '46%',
    margin: '2%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  tileValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  tileLabel: {
    fontSize: 12,
    color: COLORS.gray600,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 14,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  barEmoji: {
    fontSize: 26,
    marginRight: 12,
  },
  barBody: {
    flex: 1,
  },
  barTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  barPercent: {
    fontSize: 12,
    color: COLORS.gray600,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray100,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  bucketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bucket: {
    width: '48%',
    margin: '1%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.gray50,
    alignItems: 'center',
  },
  bucketEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  bucketName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray800,
  },
  bucketMood: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  weekCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekTrack: {
    width: 22,
    height: 90,
    borderRadius: 11,
    backgroundColor: COLORS.gray100,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekFill: {
    width: '100%',
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
  },
  weekCount: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray800,
  },
  weekDay: {
    fontSize: 11,
    color: COLORS.gray500,
  },
  empty: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 24,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 16,
  },
  lockedContent: {
    padding: 24,
    alignItems: 'center',
  },
  lockedIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  lockedIcon: {
    fontSize: 38,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gray900,
    textAlign: 'center',
    marginBottom: 10,
  },
  lockedBody: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 24,
  },
  previewCard: {
    alignSelf: 'stretch',
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: 24,
  },
  previewHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  previewCheck: {
    color: COLORS.success,
    fontWeight: '800',
    marginRight: 10,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray800,
  },
  upgradeButton: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  spacer: {
    height: 120,
  },
});

export default MoodInsightsScreen;
