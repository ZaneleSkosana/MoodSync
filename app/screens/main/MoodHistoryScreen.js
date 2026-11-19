import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';

import { COLORS } from '../../utils/colors';
import { Card } from '../../components/common/Card';
import { MoodChart } from '../../components/mood/MoodChart';
import { MoodJourneyCard } from '../../components/mood/MoodJourneyCard';
import { useMoodStore } from '../../store/moodStore';
import { formatDate, getMoodEmoji } from '../../utils/helpers';

const MOODS = [
  'Happy',
  'Sad',
  'Stressed',
  'Motivated',
  'Calm',
  'Energetic',
];

const DATE_FILTERS = [
  { label: '1 Day', value: '1' },
  { label: '7 Days', value: '7' },
  { label: '30 Days', value: '30' },
  { label: 'All', value: 'all' },
];

const getPlayedTracks = (mood) =>
  Array.isArray(mood?.played_tracks) ? mood.played_tracks : [];

const hasQualifiedPlayback = (mood) =>
  mood?.playback_qualified === true ||
  Number(mood?.playback_seconds || 0) >= 30 ||
  getPlayedTracks(mood).some(
    (track) =>
      track?.qualified === true ||
      Number(track?.listened_seconds || 0) >= 30
  );

const getMoodDate = (moodOrValue) => {
  const value =
    moodOrValue && typeof moodOrValue === 'object'
      ? moodOrValue.created_at ||
        moodOrValue.createdAt ||
        moodOrValue.timestamp ||
        moodOrValue.date
      : moodOrValue;

  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const isToday = (moodOrValue) => {
  const date = getMoodDate(moodOrValue);

  if (!date) return false;

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const formatTime = (value) => {
  const date = getMoodDate(value);

  return date
    ? date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Time unavailable';
};

const formatDuration = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;

  return minutes === 0
    ? `${remainder} sec`
    : `${minutes} min ${remainder} sec`;
};

const MoodHistoryScreen = ({ navigation }) => {
  const {
    moodHistory: storedMoodHistory,
    deleteMoodFromHistory,
    activeJourney,
  } = useMoodStore();

  const moodHistory = Array.isArray(storedMoodHistory)
    ? storedMoodHistory
    : [];

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState('7');
  const [moodFilter, setMoodFilter] = useState('All');
  const [selectedMoodDetails, setSelectedMoodDetails] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStartMood = () => {
    navigation.navigate('MoodSelection');
  };

  const handleDeleteMood = (mood) => {
    Alert.alert(
      'Delete Mood',
      'Are you sure you want to delete this mood record and its song history?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMoodFromHistory(mood.id);

            if (
              String(selectedMoodDetails?.id) === String(mood.id)
            ) {
              setSelectedMoodDetails(null);
            }
          },
        },
      ]
    );
  };

  const filteredMoodHistory = useMemo(() => {
    let filtered = moodHistory.filter((mood) => getMoodDate(mood));

    /*
     * IMPORTANT:
     * The 1 Day filter includes every mood recorded today.
     * It does not require a song to have been played.
     * It also does not require 30 seconds of playback.
     */
    if (dateFilter === '1') {
      filtered = filtered.filter((mood) => isToday(mood));
    } else if (dateFilter === '7' || dateFilter === '30') {
      const cutoff = new Date();

      cutoff.setDate(
        cutoff.getDate() - Number(dateFilter)
      );

      filtered = filtered.filter(
        (mood) => getMoodDate(mood) >= cutoff
      );
    }

    if (moodFilter !== 'All') {
      filtered = filtered.filter(
        (mood) =>
          String(mood?.mood_label || '').toLowerCase() ===
          moodFilter.toLowerCase()
      );
    }

    return filtered.sort(
      (a, b) =>
        getMoodDate(b).getTime() -
        getMoodDate(a).getTime()
    );
  }, [moodHistory, dateFilter, moodFilter]);

  const todayMoodCount = useMemo(
    () =>
      moodHistory.filter((mood) => isToday(mood)).length,
    [moodHistory]
  );

  const stats = useMemo(() => {
    const total = filteredMoodHistory.length;

    if (!total) {
      return {
        total: 0,
        average: 0,
        mostCommon: 'None',
      };
    }

    const scores = filteredMoodHistory
      .map((mood) => Number(mood?.score))
      .filter(Number.isFinite);

    const average = scores.length
      ? scores.reduce((sum, score) => sum + score, 0) /
        scores.length
      : 0;

    const counts = {};

    filteredMoodHistory.forEach((mood) => {
      const label = mood?.mood_label || 'Unknown';

      counts[label] = (counts[label] || 0) + 1;
    });

    const mostCommon = Object.keys(counts).sort(
      (a, b) => counts[b] - counts[a]
    )[0];

    return {
      total,
      average,
      mostCommon: mostCommon || 'None',
    };
  }, [filteredMoodHistory]);

  const selectedMoodTracks = useMemo(() => {
    return getPlayedTracks(selectedMoodDetails)
      .slice()
      .sort((a, b) => {
        const aTime =
          getMoodDate(a?.started_at)?.getTime() || 0;

        const bTime =
          getMoodDate(b?.started_at)?.getTime() || 0;

        return bTime - aTime;
      });
  }, [selectedMoodDetails]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Mood History</Text>

            <Text style={styles.subtitle}>
              Understand how your mood changes over time.
              Tap a mood to see the music you played.
            </Text>
          </View>

          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>
              {todayMoodCount} today
            </Text>
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>
            Time Period
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {DATE_FILTERS.map((filter) => {
              const active = dateFilter === filter.value;

              return (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterButton,
                    active && styles.activeFilterButton,
                  ]}
                  onPress={() => setDateFilter(filter.value)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      active &&
                        styles.activeFilterButtonText,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {dateFilter === '1' && (
            <Text style={styles.filterExplanation}>
              Showing all moods recorded today, even if you
              have not played a song.
            </Text>
          )}
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>
            Filter by Mood
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {['All', ...MOODS].map((mood) => {
              const active = moodFilter === mood;

              return (
                <TouchableOpacity
                  key={mood}
                  style={[
                    styles.moodFilterButton,
                    active && styles.activeMoodFilter,
                  ]}
                  onPress={() => setMoodFilter(mood)}
                  activeOpacity={0.8}
                >
                  {mood !== 'All' && (
                    <Text style={styles.moodFilterEmoji}>
                      {getMoodEmoji(mood)}
                    </Text>
                  )}

                  <Text
                    style={[
                      styles.moodFilterText,
                      active &&
                        styles.activeMoodFilterText,
                    ]}
                  >
                    {mood}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.total}
            </Text>

            <Text style={styles.statLabel}>
              Mood Records
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.average.toFixed(1)}
            </Text>

            <Text style={styles.statLabel}>
              Avg. Score
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>
              {stats.mostCommon !== 'None'
                ? getMoodEmoji(stats.mostCommon)
                : '—'}
            </Text>

            <Text style={styles.statLabel}>
              Most Common
            </Text>
          </Card>
        </View>

        <MoodChart
          moodHistory={filteredMoodHistory}
          isOneDay={dateFilter === '1'}
          onStartMood={handleStartMood}
        />

        {activeJourney && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Active Mood Journey
            </Text>

            <MoodJourneyCard journey={activeJourney} />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recent Moods
            </Text>

            <Text style={styles.resultCount}>
              {filteredMoodHistory.length} results
            </Text>
          </View>

          <Text style={styles.tapHint}>
            Tap a mood to see its songs and playback times.
          </Text>

          {filteredMoodHistory.length === 0 ? (
            <Card style={styles.emptyHistoryCard}>
              <Text style={styles.emptyHistoryEmoji}>
                🎭
              </Text>

              <Text style={styles.emptyHistoryTitle}>
                No moods found
              </Text>

              <Text style={styles.emptyHistoryText}>
                No records match the selected filters.
              </Text>

              {dateFilter === '1' && (
                <Text style={styles.emptyHistoryText}>
                  Record a mood to see it here. Song playback
                  is not required.
                </Text>
              )}

              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartMood}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>
                  Record a Mood
                </Text>
              </TouchableOpacity>
            </Card>
          ) : (
            filteredMoodHistory.map((mood, index) => {
              const tracks = getPlayedTracks(mood);
              const qualified = hasQualifiedPlayback(mood);

              return (
                <Card
                  key={
                    mood.id ||
                    `${getMoodDate(mood)?.getTime()}-${index}`
                  }
                  style={styles.moodCard}
                >
                  <TouchableOpacity
                    style={styles.moodTapArea}
                    onPress={() =>
                      setSelectedMoodDetails(mood)
                    }
                    activeOpacity={0.75}
                  >
                    <View style={styles.moodIconContainer}>
                      <Text style={styles.moodIcon}>
                        {getMoodEmoji(mood.mood_label)}
                      </Text>
                    </View>

                    <View style={styles.moodInfo}>
                      <Text style={styles.moodName}>
                        {mood.mood_label || 'Unknown mood'}
                      </Text>

                      <Text style={styles.moodDate}>
                        {formatDate(
                          mood.created_at ||
                            mood.createdAt ||
                            mood.timestamp ||
                            mood.date
                        )}
                      </Text>

                      {mood.environment ? (
                        <Text style={styles.moodEnvironment}>
                          📍 {mood.environment}
                        </Text>
                      ) : null}

                      {mood.score !== undefined &&
                      mood.score !== null ? (
                        <Text style={styles.moodScore}>
                          ⭐ {mood.score}/10
                        </Text>
                      ) : null}

                      {tracks.length > 0 ? (
                        <Text style={styles.trackCount}>
                          {tracks.length} song
                          {tracks.length === 1 ? '' : 's'} tracked
                        </Text>
                      ) : null}

                      {qualified ? (
                        <Text style={styles.qualifiedText}>
                          ✓ 30-second playback reached
                        </Text>
                      ) : null}

                      <Text style={styles.viewDetails}>
                        View song history ›
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMood(mood)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteText}>
                      🗑️
                    </Text>
                  </TouchableOpacity>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(selectedMoodDetails)}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSelectedMoodDetails(null)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleArea}>
                <Text style={styles.modalEmoji}>
                  {getMoodEmoji(
                    selectedMoodDetails?.mood_label
                  )}
                </Text>

                <View style={styles.modalTitleTextArea}>
                  <Text style={styles.modalTitle}>
                    {selectedMoodDetails?.mood_label ||
                      'Mood details'}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    {getMoodDate(
                      selectedMoodDetails
                    )?.toLocaleString([], {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) || 'Date unavailable'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  setSelectedMoodDetails(null)
                }
              >
                <Text style={styles.closeButtonText}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {selectedMoodDetails?.environment ? (
              <Text style={styles.modalEnvironment}>
                📍 Environment:{' '}
                {selectedMoodDetails.environment}
              </Text>
            ) : null}

            <View style={styles.modalSummary}>
              <Text style={styles.modalSummaryTitle}>
                Playback Summary
              </Text>

              <Text style={styles.modalSummaryText}>
                {selectedMoodTracks.length} song
                {selectedMoodTracks.length === 1 ? '' : 's'} tracked
                {' · '}
                {hasQualifiedPlayback(selectedMoodDetails)
                  ? '30-second playback reached'
                  : '30-second playback not reached'}
              </Text>
            </View>

            <ScrollView
              style={styles.songList}
              showsVerticalScrollIndicator={false}
            >
              {selectedMoodTracks.length === 0 ? (
                <View style={styles.noSongs}>
                  <Text style={styles.noSongsEmoji}>
                    🎵
                  </Text>

                  <Text style={styles.noSongsTitle}>
                    No song history for this mood
                  </Text>

                  <Text style={styles.noSongsText}>
                    This mood record is saved even if you
                    did not play a song.
                  </Text>
                </View>
              ) : (
                selectedMoodTracks.map((track, index) => (
                  <View
                    key={
                      track.id ||
                      `${track.title}-${index}`
                    }
                    style={styles.songItem}
                  >
                    <View style={styles.songNumber}>
                      <Text style={styles.songNumberText}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle}>
                        {track.title || 'Unknown song'}
                      </Text>

                      <Text style={styles.songArtist}>
                        {track.artist || 'Unknown artist'}
                      </Text>

                      <Text style={styles.songTime}>
                        ▶ Started: {formatTime(track.started_at)}
                      </Text>

                      <Text style={styles.songDuration}>
                        Listened for:{' '}
                        {formatDuration(track.listened_seconds)}
                      </Text>

                      <Text
                        style={[
                          styles.songStatus,
                          (track.qualified ||
                            Number(
                              track.listened_seconds || 0
                            ) >= 30) &&
                            styles.songStatusQualified,
                        ]}
                      >
                        {track.qualified ||
                        Number(track.listened_seconds || 0) >=
                          30
                          ? '✓ Reached 30 seconds'
                          : 'Not yet at 30 seconds'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() =>
                setSelectedMoodDetails(null)
              }
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50 || '#F8FAFC',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 19,
  },

  todayBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    marginLeft: 8,
  },

  todayBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  filterSection: {
    marginBottom: 16,
  },

  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray800,
    marginBottom: 8,
  },

  filterRow: {
    gap: 8,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.gray100 || '#F1F5F9',
  },

  activeFilterButton: {
    backgroundColor: COLORS.primary,
  },

  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray600,
  },

  activeFilterButtonText: {
    color: '#FFFFFF',
  },

  filterExplanation: {
    fontSize: 11,
    color: COLORS.gray600,
    lineHeight: 17,
    marginTop: 8,
  },

  moodFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.gray100 || '#F1F5F9',
  },

  activeMoodFilter: {
    backgroundColor: COLORS.primary,
  },

  moodFilterEmoji: {
    fontSize: 14,
    marginRight: 5,
  },

  moodFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray600,
  },

  activeMoodFilterText: {
    color: '#FFFFFF',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    minHeight: 90,
  },

  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },

  statEmoji: {
    fontSize: 25,
  },

  statLabel: {
    fontSize: 10,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: 5,
  },

  section: {
    marginTop: 4,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.gray900,
  },

  resultCount: {
    fontSize: 11,
    color: COLORS.gray500,
  },

  tapHint: {
    fontSize: 12,
    color: COLORS.gray600,
    marginBottom: 12,
  },

  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 9,
  },

  moodTapArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  moodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray50 || '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  moodIcon: {
    fontSize: 28,
  },

  moodInfo: {
    flex: 1,
    marginLeft: 12,
  },

  moodName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
  },

  moodDate: {
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 3,
  },

  moodEnvironment: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 3,
  },

  moodScore: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 3,
  },

  trackCount: {
    fontSize: 11,
    color: COLORS.gray700,
    marginTop: 5,
  },

  qualifiedText: {
    fontSize: 11,
    color: COLORS.success || '#10B981',
    marginTop: 4,
    fontWeight: '700',
  },

  viewDetails: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 5,
  },

  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100 || '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  deleteText: {
    fontSize: 15,
  },

  emptyHistoryCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },

  emptyHistoryEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyHistoryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.gray900,
  },

  emptyHistoryText: {
    fontSize: 12,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 18,
  },

  startButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 16,
  },

  startButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: COLORS.white || '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 26,
    maxHeight: '88%',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  modalTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  modalEmoji: {
    fontSize: 32,
    marginRight: 12,
  },

  modalTitleTextArea: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gray900,
  },

  modalSubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 3,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray100 || '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  closeButtonText: {
    fontSize: 16,
    color: COLORS.gray800,
    fontWeight: '700',
  },

  modalEnvironment: {
    fontSize: 12,
    color: COLORS.gray600,
    marginBottom: 12,
  },

  modalSummary: {
    backgroundColor: COLORS.gray50 || '#F8FAFC',
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
  },

  modalSummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gray900,
  },

  modalSummaryText: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 4,
  },

  songList: {
    flexGrow: 0,
    flexShrink: 1,
  },

  songItem: {
    flexDirection: 'row',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100 || '#F1F5F9',
  },

  songNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  songNumberText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
  },

  songInfo: {
    flex: 1,
    marginLeft: 11,
  },

  songTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gray900,
  },

  songArtist: {
    fontSize: 12,
    color: COLORS.gray600,
    marginTop: 3,
  },

  songTime: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 7,
  },

  songDuration: {
    fontSize: 11,
    color: COLORS.gray700,
    marginTop: 4,
  },

  songStatus: {
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 5,
  },

  songStatusQualified: {
    color: COLORS.success || '#10B981',
    fontWeight: '700',
  },

  noSongs: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 12,
  },

  noSongsEmoji: {
    fontSize: 34,
    marginBottom: 10,
  },

  noSongsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gray900,
    textAlign: 'center',
  },

  noSongsText: {
    fontSize: 12,
    color: COLORS.gray600,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },

  doneButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },

  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default MoodHistoryScreen;