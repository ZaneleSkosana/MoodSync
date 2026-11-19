import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ADMIN } from '../../utils/adminTheme';
import { Avatar, Pill, EmptyState } from '../../components/admin/AdminUI';
import { adminService } from '../../services/adminService';
import { timeAgo } from '../../utils/adminFormat';

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const TONES = { pending: 'amber', approved: 'green', rejected: 'red' };

const AdminApplicationsScreen = ({ navigation }) => {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const result = await adminService.listApplications(status);

    if (result.success) {
      setItems(Array.isArray(result.data) ? result.data : []);
      setError(null);
    } else {
      setError('Could not load requests. Make sure the admin SQL migration has been run.');
    }

    setLoading(false);
    setRefreshing(false);
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const selectTab = (id) => {
    if (id === status) {
      return;
    }
    setLoading(true);
    setStatus(id);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('ApplicationDetail', { application: item })}
    >
      <Avatar name={item.full_name} email={item.email} color={ADMIN.amber} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.full_name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.job_title} · {item.organisation}
        </Text>
        <View style={styles.pills}>
          <Pill label={item.status.toUpperCase()} tone={TONES[item.status]} />
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>Admin requests</Text>
        <Text style={styles.subtitle}>
          Review the documents people submitted before giving them admin access.
        </Text>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, status === tab.id && styles.tabActive]}
              onPress={() => selectTab(tab.id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, status === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={ADMIN.accentLight} style={styles.loader} />
      ) : error ? (
        <EmptyState icon="⚠️" title="Requests unavailable" body={error} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={ADMIN.accentLight}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={status === 'pending' ? '🎉' : '📂'}
              title={status === 'pending' ? 'All caught up' : 'Nothing here yet'}
              body={
                status === 'pending'
                  ? 'There are no admin requests waiting for review.'
                  : `No ${status} requests.`
              }
            />
          }
          ListFooterComponent={<View style={styles.footer} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN.bg,
  },
  top: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: ADMIN.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: ADMIN.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 14,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: ADMIN.card,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: ADMIN.border,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: ADMIN.accent,
  },
  tabText: {
    color: ADMIN.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ADMIN.border,
  },
  body: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: ADMIN.text,
    fontSize: 15,
    fontWeight: '800',
  },
  meta: {
    color: ADMIN.textMuted,
    fontSize: 12,
    marginTop: 1,
    marginBottom: 6,
  },
  pills: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    color: ADMIN.textDim,
    fontSize: 11,
  },
  chevron: {
    color: ADMIN.textMuted,
    fontSize: 24,
    marginLeft: 8,
  },
  footer: {
    height: 40,
  },
});

export default AdminApplicationsScreen;
