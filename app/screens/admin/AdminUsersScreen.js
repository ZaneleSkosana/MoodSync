import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ADMIN } from '../../utils/adminTheme';
import { Avatar, Pill, EmptyState } from '../../components/admin/AdminUI';
import { adminService } from '../../services/adminService';
import { formatDate } from '../../utils/adminFormat';

const PAGE_SIZE = 20;

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'users', label: 'Users' },
  { id: 'admins', label: 'Admins' },
  { id: 'premium', label: 'Premium' },
  { id: 'disabled', label: 'Disabled' },
];

const AdminUsersScreen = ({ navigation, route }) => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const incoming = route?.params?.filter;
    if (incoming) {
      setFilter(incoming);
      navigation.setParams({ filter: undefined });
    }
  }, [route?.params?.filter, navigation]);

  const fetchPage = useCallback(
    async (offset, replace) => {
      const current = ++requestId.current;
      const result = await adminService.listUsers({
        search: query,
        filter,
        limit: PAGE_SIZE,
        offset,
      });

      if (current !== requestId.current) {
        return;
      }

      if (result.success) {
        const rows = Array.isArray(result.data) ? result.data : [];
        setUsers((previous) => (replace ? rows : [...previous, ...rows]));
        setHasMore(rows.length === PAGE_SIZE);
        setError(null);
      } else {
        setError('Could not load users. Make sure the admin SQL migration has been run.');
      }

      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    },
    [query, filter]
  );

  useEffect(() => {
    setLoading(true);
  }, [query, filter]);

  useFocusEffect(
    useCallback(() => {
      fetchPage(0, true);
    }, [fetchPage])
  );

  const onEndReached = () => {
    if (loading || loadingMore || !hasMore || error) {
      return;
    }
    setLoadingMore(true);
    fetchPage(users.length, false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage(0, true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('UserDetail', { userId: item.id })}
    >
      <Avatar
        name={item.full_name}
        email={item.email}
        color={item.is_disabled ? ADMIN.textDim : item.role === 'admin' ? ADMIN.amber : ADMIN.accent}
      />
      <View style={styles.rowBody}>
        <Text style={styles.name} numberOfLines={1}>
          {item.full_name || 'No name'}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {item.email}
        </Text>
        <View style={styles.pills}>
          {item.role === 'admin' ? <Pill label="ADMIN" tone="amber" /> : null}
          {item.is_disabled ? <Pill label="DISABLED" tone="red" /> : <Pill label="ACTIVE" tone="green" />}
          {item.plan_name ? <Pill label={item.plan_name.toUpperCase()} tone="indigo" /> : null}
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.joined}>{formatDate(item.created_at)}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>Users</Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or email"
            placeholderTextColor={ADMIN.textDim}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clear}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filters}>
          {FILTERS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, filter === item.id && styles.chipActive]}
              onPress={() => setFilter(item.id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, filter === item.id && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={ADMIN.accentLight} style={styles.loader} />
      ) : error ? (
        <EmptyState icon="⚠️" title="Users unavailable" body={error} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={ADMIN.accentLight}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🙈"
              title="No accounts found"
              body="Try a different search or filter."
            />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={ADMIN.accentLight} style={styles.footer} /> : <View style={styles.footer} />
          }
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
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN.border,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: ADMIN.text,
    fontSize: 15,
  },
  clear: {
    color: ADMIN.textMuted,
    fontSize: 16,
    padding: 4,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: ADMIN.card,
    borderWidth: 1,
    borderColor: ADMIN.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: ADMIN.accent,
    borderColor: ADMIN.accent,
  },
  chipText: {
    color: ADMIN.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 6,
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
  rowBody: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: ADMIN.text,
    fontSize: 15,
    fontWeight: '800',
  },
  email: {
    color: ADMIN.textMuted,
    fontSize: 12,
    marginTop: 1,
    marginBottom: 6,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rowRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  joined: {
    color: ADMIN.textDim,
    fontSize: 11,
  },
  chevron: {
    color: ADMIN.textMuted,
    fontSize: 24,
    marginTop: 2,
  },
  footer: {
    height: 40,
  },
});

export default AdminUsersScreen;
