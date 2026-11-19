import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import Svg, {
  Circle,
  Line,
  Polyline,
  Text as SvgText,
} from 'react-native-svg';

import { COLORS } from '../../utils/colors';
import { Card } from '../common/Card';
import { getMoodEmoji } from '../../utils/helpers';

const MOODS = [
  {
    label: 'Happy',
    color: COLORS.moodHappy || '#FCD34D',
    level: 5,
  },
  {
    label: 'Sad',
    color: COLORS.moodSad || '#60A5FA',
    level: 1,
  },
  {
    label: 'Stressed',
    color: COLORS.moodStressed || '#F87171',
    level: 2,
  },
  {
    label: 'Motivated',
    color: COLORS.moodMotivated || '#34D399',
    level: 6,
  },
  {
    label: 'Calm',
    color: COLORS.moodCalm || '#A78BFA',
    level: 3,
  },
  {
    label: 'Energetic',
    color: COLORS.moodEnergetic || '#FB923C',
    level: 4,
  },
];

const CHART_HEIGHT = 190;
const SIDE_PADDING = 26;
const TOP_PADDING = 20;
const BOTTOM_PADDING = 24;

const getMoodDate = (mood) => {
  const value =
    mood?.created_at ||
    mood?.createdAt ||
    mood?.timestamp ||
    mood?.date;

  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getMoodConfig = (label) =>
  MOODS.find(
    (mood) =>
      mood.label.toLowerCase() ===
      String(label || '').toLowerCase()
  ) || {
    label: label || 'Unknown',
    color: COLORS.primary || '#2563EB',
    level: 3,
  };

const formatTimeLabel = (value, oneDay) => {
  const date = getMoodDate(value);

  if (!date) return '';

  if (oneDay) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  });
};

export const MoodChart = ({
  moodHistory = [],
  isOneDay = false,
  onStartMood,
}) => {
  const [chartWidth, setChartWidth] = useState(300);
  const [selectedMoodId, setSelectedMoodId] = useState(null);

  const safeHistory = Array.isArray(moodHistory)
    ? moodHistory
    : [];

  const chronologicalHistory = useMemo(() => {
    return safeHistory
      .filter((mood) => getMoodDate(mood))
      .slice()
      .sort((a, b) => getMoodDate(a) - getMoodDate(b));
  }, [safeHistory]);

  const selectedMood = chronologicalHistory.find(
    (mood, index) =>
      String(
        mood?.id ??
          `${getMoodDate(mood)?.getTime()}-${index}`
      ) === selectedMoodId
  ) || null;

  const chartData = useMemo(() => {
    return MOODS.map((mood) => {
      const matchingMoods = safeHistory.filter(
        (item) =>
          String(item?.mood_label || '').toLowerCase() ===
          mood.label.toLowerCase()
      );

      const scores = matchingMoods
        .map((item) => Number(item?.score))
        .filter(Number.isFinite);

      const averageScore = scores.length
        ? scores.reduce((sum, score) => sum + score, 0) /
          scores.length
        : 0;

      return {
        ...mood,
        count: matchingMoods.length,
        averageScore,
      };
    });
  }, [safeHistory]);

  const total = chartData.reduce(
    (sum, mood) => sum + mood.count,
    0
  );

  const highestCount = Math.max(
    1,
    ...chartData.map((mood) => mood.count)
  );

  const mostCommon = [...chartData].sort(
    (a, b) => b.count - a.count
  )[0];

  const hasData = total > 0;

  const graphWidth = Math.max(240, chartWidth - 16);
  const plotWidth = Math.max(
    1,
    graphWidth - SIDE_PADDING * 2
  );

  const plotHeight =
    CHART_HEIGHT - TOP_PADDING - BOTTOM_PADDING;

  const points = useMemo(() => {
    const count = chronologicalHistory.length;

    if (!count) return [];

    return chronologicalHistory.map((mood, index) => {
      const moodConfig = getMoodConfig(mood?.mood_label);

      const x =
        count === 1
          ? SIDE_PADDING + plotWidth / 2
          : SIDE_PADDING +
            (index / (count - 1)) * plotWidth;

      const y =
        TOP_PADDING +
        ((6 - moodConfig.level) / 5) * plotHeight;

      const id = String(
        mood?.id ??
          `${getMoodDate(mood)?.getTime()}-${index}`
      );

      return {
        mood,
        x,
        y,
        id,
        moodConfig,
        index,
      };
    });
  }, [chronologicalHistory, plotWidth, plotHeight]);

  const polylinePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(' ');

  const getSelectedDateText = (mood) => {
    const date = getMoodDate(mood);

    if (!date) return 'Date unavailable';

    return date.toLocaleString([], {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Mood Overview
        </Text>

        <Text style={styles.subtitle}>
          {isOneDay
            ? "All moods recorded today, whether or not you've played a song"
            : 'Your mood breakdown for the selected period'}
        </Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {total}
          </Text>

          <Text style={styles.summaryLabel}>
            Mood records
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryEmoji}>
            {hasData && mostCommon.count > 0
              ? getMoodEmoji(mostCommon.label)
              : '—'}
          </Text>

          <Text style={styles.summaryLabel}>
            {hasData && mostCommon.count > 0
              ? `Most common: ${mostCommon.label}`
              : 'No leading mood yet'}
          </Text>
        </View>
      </View>

      {/* Interactive trend line */}
      <Text style={styles.chartHeading}>
        Your mood trend
      </Text>

      <Text style={styles.chartExplanation}>
        Select any point on the line to see the mood emoji
        and the time it was recorded.
      </Text>

      {points.length > 0 ? (
        <View
          onLayout={(event) =>
            setChartWidth(event.nativeEvent.layout.width)
          }
          style={styles.lineChartContainer}
        >
          <Svg
            width="100%"
            height={CHART_HEIGHT}
            viewBox={`0 0 ${graphWidth} ${CHART_HEIGHT}`}
          >
            {[1, 2, 3, 4, 5, 6].map((level) => {
              const y =
                TOP_PADDING +
                ((6 - level) / 5) * plotHeight;

              const config = MOODS.find(
                (mood) => mood.level === level
              );

              return (
                <React.Fragment key={level}>
                  <Line
                    x1={SIDE_PADDING}
                    y1={y}
                    x2={graphWidth - SIDE_PADDING}
                    y2={y}
                    stroke={COLORS.gray200 || '#E2E8F0'}
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />

                  <SvgText
                    x="2"
                    y={y + 4}
                    fontSize="10"
                    fill={config?.color || COLORS.gray500}
                  >
                    {getMoodEmoji(config?.label || '')}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {points.length > 1 && (
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke={COLORS.primary || '#2563EB'}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {points.map((point) => (
              <React.Fragment key={point.id}>
                {/* Larger invisible target makes points easier to tap */}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill="transparent"
                  onPress={() =>
                    setSelectedMoodId(point.id)
                  }
                />

                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={
                    selectedMoodId === point.id
                      ? 6
                      : 4.5
                  }
                  fill={point.moodConfig.color}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  onPress={() =>
                    setSelectedMoodId(point.id)
                  }
                />
              </React.Fragment>
            ))}
          </Svg>

          <View style={styles.axisLabels}>
            <Text style={styles.axisLabel}>
              {formatTimeLabel(
                chronologicalHistory[0],
                isOneDay
              )}
            </Text>

            <Text style={styles.axisLabel}>
              {chronologicalHistory.length > 1
                ? formatTimeLabel(
                    chronologicalHistory[
                      chronologicalHistory.length - 1
                    ],
                    isOneDay
                  )
                : '1 record'}
            </Text>
          </View>

          {/* Selected graph point details */}
          {selectedMood ? (
            <View style={styles.selectedMoodBox}>
              <Text style={styles.selectedMoodEmoji}>
                {getMoodEmoji(selectedMood.mood_label)}
              </Text>

              <View style={styles.selectedMoodInfo}>
                <Text style={styles.selectedMoodTitle}>
                  {selectedMood.mood_label || 'Unknown mood'}
                </Text>

                <Text style={styles.selectedMoodDate}>
                  {getSelectedDateText(selectedMood)}
                </Text>

                {selectedMood.environment ? (
                  <Text style={styles.selectedMoodExtra}>
                    📍 {selectedMood.environment}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <Text style={styles.tapHint}>
              Tap a point on the graph to view that mood.
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>
            📈
          </Text>

          <Text style={styles.emptyTitle}>
            Nothing to show yet
          </Text>

          <Text style={styles.emptyText}>
            Your mood trend will appear when you record
            moods in the selected period.
          </Text>

          {onStartMood ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={onStartMood}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>
                Record a Mood
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <View style={styles.sectionDivider} />

      {/* Mood breakdown */}
      <Text style={styles.chartHeading}>
        How often did you feel each mood?
      </Text>

      <Text style={styles.chartExplanation}>
        Each bar shows how many times you recorded a mood
        in the selected period.
      </Text>

      {hasData ? (
        <View style={styles.chart}>
          {chartData.map((mood) => {
            const barWidth =
              mood.count === 0
                ? 0
                : (mood.count / highestCount) * 100;

            const percentage = Math.round(
              (mood.count / total) * 100
            );

            return (
              <View
                key={mood.label}
                style={styles.moodRow}
              >
                <View style={styles.moodLabelRow}>
                  <Text style={styles.moodEmoji}>
                    {getMoodEmoji(mood.label)}
                  </Text>

                  <Text style={styles.moodLabel}>
                    {mood.label}
                  </Text>

                  <Text style={styles.moodCount}>
                    {mood.count}{' '}
                    {mood.count === 1 ? 'record' : 'records'}
                  </Text>
                </View>

                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: mood.color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.barFooter}>
                  <Text style={styles.percentageText}>
                    {percentage}% of your records
                  </Text>

                  {mood.averageScore > 0 ? (
                    <Text style={styles.averageText}>
                      Average score:{' '}
                      {mood.averageScore.toFixed(1)}/10
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.noBreakdownText}>
          Mood breakdowns will appear here after you record
          a mood.
        </Text>
      )}

      {hasData ? (
        <View style={styles.legendBox}>
          <Text style={styles.legendTitle}>
            How to read this overview
          </Text>

          <Text style={styles.legendText}>
            • Tap a point on the line to see the mood and its emoji.
          </Text>

          <Text style={styles.legendText}>
            • Longer bars mean that mood was recorded more often.
          </Text>

          <Text style={styles.legendText}>
            • Average scores appear when score data is available.
          </Text>
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 18,
  },

  header: {
    marginBottom: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gray900 || '#0F172A',
  },

  subtitle: {
    fontSize: 12,
    color: COLORS.gray600 || '#475569',
    marginTop: 5,
    lineHeight: 18,
  },

  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50 || '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryNumber: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.primary || '#1E3A8A',
  },

  summaryEmoji: {
    fontSize: 24,
  },

  summaryLabel: {
    fontSize: 11,
    textAlign: 'center',
    color: COLORS.gray600 || '#475569',
    marginTop: 4,
  },

  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: COLORS.gray200 || '#E2E8F0',
    marginHorizontal: 10,
  },

  chartHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gray900 || '#0F172A',
  },

  chartExplanation: {
    fontSize: 12,
    color: COLORS.gray600 || '#475569',
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 14,
  },

  lineChartContainer: {
    width: '100%',
    marginBottom: 8,
  },

  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
    paddingHorizontal: 24,
  },

  axisLabel: {
    fontSize: 10,
    color: COLORS.gray500 || '#64748B',
  },

  selectedMoodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 12,
    backgroundColor: COLORS.gray50 || '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200 || '#E2E8F0',
  },

  selectedMoodEmoji: {
    fontSize: 32,
    marginRight: 12,
  },

  selectedMoodInfo: {
    flex: 1,
  },

  selectedMoodTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gray900 || '#0F172A',
  },

  selectedMoodDate: {
    fontSize: 11,
    color: COLORS.gray600 || '#475569',
    marginTop: 3,
  },

  selectedMoodExtra: {
    fontSize: 11,
    color: COLORS.gray600 || '#475569',
    marginTop: 3,
  },

  tapHint: {
    fontSize: 11,
    textAlign: 'center',
    color: COLORS.gray500 || '#64748B',
    marginTop: 10,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.gray200 || '#E2E8F0',
    marginVertical: 20,
  },

  chart: {
    gap: 18,
  },

  moodRow: {
    width: '100%',
  },

  moodLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  moodEmoji: {
    fontSize: 17,
    marginRight: 7,
  },

  moodLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray800 || '#1E293B',
  },

  moodCount: {
    fontSize: 11,
    color: COLORS.gray600 || '#475569',
  },

  barBackground: {
    height: 12,
    borderRadius: 10,
    backgroundColor: COLORS.gray100 || '#F1F5F9',
    overflow: 'hidden',
  },

  barFill: {
    height: '100%',
    borderRadius: 10,
  },

  barFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 4,
  },

  percentageText: {
    fontSize: 10,
    color: COLORS.gray500 || '#64748B',
  },

  averageText: {
    fontSize: 10,
    color: COLORS.gray600 || '#475569',
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },

  emptyEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900 || '#0F172A',
  },

  emptyText: {
    fontSize: 12,
    color: COLORS.gray600 || '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 7,
  },

  noBreakdownText: {
    fontSize: 12,
    color: COLORS.gray600 || '#475569',
    textAlign: 'center',
    paddingVertical: 18,
  },

  startButton: {
    backgroundColor: COLORS.primary || '#1E3A8A',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 16,
  },

  startButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  legendBox: {
    backgroundColor: COLORS.gray50 || '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 22,
  },

  legendTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gray800 || '#1E293B',
    marginBottom: 7,
  },

  legendText: {
    fontSize: 11,
    color: COLORS.gray600 || '#475569',
    lineHeight: 18,
    marginBottom: 3,
  },
});