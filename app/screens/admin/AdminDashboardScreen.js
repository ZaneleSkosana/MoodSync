import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { ADMIN } from '../../utils/adminTheme';
import { StatCard, SectionCard, EmptyState, Pill } from '../../components/admin/AdminUI';
import { adminService } from '../../services/adminService';
import { useUserStore } from '../../store/userStore';
import { useProfileStore } from '../../store/profileStore';
import {
  formatCount,
  formatCurrency,
  describeAction,
  timeAgo,
} from '../../utils/adminFormat';

const SHORT_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const AdminDashboardScreen = ({ navigation }) => {
  const user = useUserStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const [statsResult, activityResult] = await Promise.all([
      adminService.getDashboardStats(),
      adminService.getRecentActivity(6),
    ]);

    if (statsResult.success) {
      setStats(statsResult.data);
      setError(null);
    } else {
      setError('Could not load dashboard data. Make sure the admin SQL migration has been run.');
    }

    if (activityResult.success) {
      setActivity(Array.isArray(activityResult.data) ? activityResult.data : []);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const name = profile?.full_name || user?.user_metadata?.full_name || 'Admin';
  const days = stats?.signups_by_day || [];
  const maxDay = Math.max(1, ...days.map((day) => Number(day.count) || 0));
  const total = Number(stats?.total_users) || 0;
  const disabledShare = total ? Math.round(((Number(stats?.disabled_users) || 0) / total) * 100) : 0;
  const adminShare = total ? Math.round(((Number(stats?.admins) || 0) / total) * 100) : 0;
  const userShare = Math.max(0, 100 - disabledShare - adminShare);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ADMIN.accentLight} />
      }
    >
      <LinearGradient
        colors={ADMIN.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroLabel}>ADMIN CONSOLE</Text>
        <Text style={styles.heroTitle}>Welcome back, {name.split(' ')[0]}</Text>
        <Text style={styles.heroSubtitle}>
          Here is how MoodSync is doing right now.
        </Text>
        <View style={styles.heroTotal}>
          <Text style={styles.heroTotalValue}>{formatCount(total)}</Text>
          <Text style={styles.heroTotalLabel}>accounts created</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={ADMIN.accentLight} style={styles.loader} />
      ) : error ? (
        <EmptyState icon="⚠️" title="Dashboard unavailable" body={error} />
      ) : (
        <>
          <View style={styles.grid}>
            <StatCard
              label="New today"
              value={formatCount(stats.new_today)}
              accent={ADMIN.cyan}
              icon="🆕"
            />
            <StatCard
              label="Last 7 days"
              value={formatCount(stats.new_7d)}
              accent={ADMIN.accent}
              icon="📈"
            />
            <StatCard
              label="Last 30 days"
              value={formatCount(stats.new_30d)}
              accent={ADMIN.pink}
              icon="🗓️"
            />
            <StatCard
              label="Active"
              value={formatCount(stats.active_users)}
              accent={ADMIN.green}
              icon="✅"
            />
            <StatCard
              label="Disabled"
              value={formatCount(stats.disabled_users)}
              accent={ADMIN.red}
              icon="⛔"
              onPress={() => navigation.navigate('Users', { screen: 'UsersList', params: { filter: 'disabled' } })}
            />
            <StatCard
              label="Admins"
              value={formatCount(stats.admins)}
              accent={ADMIN.amber}
              icon="🛡️"
              onPress={() => navigation.navigate('Users', { screen: 'UsersList', params: { filter: 'admins' } })}
            />
            <StatCard
              label="Premium"
              value={formatCount(stats.premium_subscribers)}
              hint={`${formatCurrency(stats.monthly_revenue)} / month`}
              accent={ADMIN.accentLight}
              icon="💎"
              onPress={() => navigation.navigate('Users', { screen: 'UsersList', params: { filter: 'premium' } })}
            />
            <StatCard
              label="Pending requests"
              value={formatCount(stats.pending_applications)}
              hint="Admin applications"
              accent={ADMIN.amber}
              icon="📨"
              onPress={() => navigation.navigate('Applications')}
            />
          </View>

          <SectionCard title="Sign-ups, last 14 days">
            <View style={styles.chart}>
              {days.map((day, index) => {
                const count = Number(day.count) || 0;
                const date = new Date(`${day.day}T00:00:00`);
                return (
                  <View key={day.day} style={styles.chartCol}>
                    <Text style={styles.chartCount}>{count || ''}</Text>
                    <View style={styles.chartTrack}>
                      <View
                        style={[
                          styles.chartFill,
                          {
                            height: `${Math.max((count / maxDay) * 100, count ? 10 : 3)}%`,
                            opacity: index === days.length - 1 ? 1 : 0.75,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartDay}>{SHORT_DAYS[date.getDay()]}</Text>
                  </View>
                );
              })}
            </View>
          </SectionCard>

          <SectionCard title="Account mix">
            <View style={styles.mixBar}>
              <View style={[styles.mixSegment, { flex: Math.max(userShare, 0.01), backgroundColor: ADMIN.accent }]} />
              <View style={[styles.mixSegment, { flex: Math.max(adminShare, 0.01), backgroundColor: ADMIN.amber }]} />
              <View style={[styles.mixSegment, { flex: Math.max(disabledShare, 0.01), backgroundColor: ADMIN.red }]} />
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: ADMIN.accent }]} />
                <Text style={styles.legendText}>Users {userShare}%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: ADMIN.amber }]} />
                <Text style={styles.legendText}>Admins {adminShare}%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: ADMIN.red }]} />
                <Text style={styles.legendText}>Disabled {disabledShare}%</Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard
            title="Recent admin activity"
            right={
              <TouchableOpacity onPress={() => navigation.navigate('Users')}>
                <Text style={styles.link}>Manage users</Text>
              </TouchableOpacity>
            }
          >
            {activity.length === 0 ? (
              <Text style={styles.muted}>No admin actions yet.</Text>
            ) : (
              activity.map((entry) => (
                <View key={entry.id} style={styles.activityRow}>
                  <View style={styles.activityText}>
                    <Text style={styles.activityTitle}>{describeAction(entry)}</Text>
                    {entry.details ? (
                      <Text style={styles.activityDetails} numberOfLines={2}>
                        {entry.details}
                      </Text>
                    ) : null}
                  </View>
                  <Pill label={timeAgo(entry.created_at)} />
                </View>
              ))
            )}
          </SectionCard>
        </>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN.bg,
  },
  content: {
    paddingBottom: 24,
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 4,
  },
  heroTotal: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 18,
  },
  heroTotalValue: {
    color: '#FFFFFF',
    fontSize: 46,
    fontWeight: '800',
    lineHeight: 50,
  },
  heroTotalLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    marginBottom: 8,
  },
  loader: {
    marginTop: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 130,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  chartCount: {
    color: ADMIN.textMuted,
    fontSize: 10,
    fontWeight: '700',
    height: 14,
  },
  chartTrack: {
    flex: 1,
    width: 12,
    borderRadius: 6,
    backgroundColor: ADMIN.bgSoft,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartFill: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: ADMIN.cyan,
  },
  chartDay: {
    color: ADMIN.textDim,
    fontSize: 10,
    marginTop: 6,
  },
  mixBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 14,
  },
  mixSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: ADMIN.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  link: {
    color: ADMIN.accentLight,
    fontSize: 13,
    fontWeight: '700',
  },
  muted: {
    color: ADMIN.textMuted,
    fontSize: 13,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.border,
  },
  activityText: {
    flex: 1,
    marginRight: 10,
  },
  activityTitle: {
    color: ADMIN.text,
    fontSize: 13,
    fontWeight: '600',
  },
  activityDetails: {
    color: ADMIN.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  spacer: {
    height: 40,
  },
});

export default AdminDashboardScreen;
