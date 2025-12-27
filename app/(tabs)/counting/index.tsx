import { useCountingSession } from '@/context/CountingSessionContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function CountingHomeScreen() {
  const router = useRouter();
  const {
    currentSession,
    sessions,
    isLoading,
    error,
    createSession,
    loadSession,
    loadAllSessions,
    deleteSession,
  } = useCountingSession();

  const [warehouseCode, setWarehouseCode] = useState('01');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllSessions();
  }, []);

  const handleCreateSession = async () => {
    try {
      await createSession(warehouseCode);
      router.push('/(tabs)/counting/active-session');
    } catch (err: any) {
      console.error('Create session error:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to create session';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleResumeSession = async (sessionId: string) => {
    try {
      await loadSession(sessionId);
      router.push('/(tabs)/counting/active-session');
    } catch (err) {
      Alert.alert('Error', 'Failed to load session');
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(sessionId);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllSessions();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'paused':
        return '#f59e0b';
      case 'completed':
        return '#3b82f6';
      case 'submitted':
        return '#6366f1';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderSession = ({ item }: { item: any }) => {
    const itemCount = item.items?.length || 0;
    const isActive = item.status === 'active' || item.status === 'paused';

    return (
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View>
            <Text style={styles.sessionWarehouse}>Warehouse {item.warehouse_code}</Text>
            <Text style={styles.sessionDate}>
              {new Date(item.started_at).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionInfoText}>{itemCount} items counted</Text>
        </View>

        <View style={styles.sessionActions}>
          {isActive && (
            <Pressable
              style={styles.resumeButton}
              onPress={() => handleResumeSession(item.id)}
            >
              <Text style={styles.resumeButtonText}>
                {item.status === 'active' ? 'Continue' : 'Resume'}
              </Text>
            </Pressable>
          )}
          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDeleteSession(item.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Counting</Text>
      </View>

      <View style={styles.newSessionCard}>
        <Text style={styles.newSessionTitle}>Start New Session</Text>
        <View style={styles.warehouseInput}>
          <Text style={styles.label}>Warehouse Code:</Text>
          <TextInput
            style={styles.input}
            value={warehouseCode}
            onChangeText={setWarehouseCode}
            placeholder="Enter warehouse code"
            autoCapitalize="characters"
          />
        </View>
        <Pressable
          style={[styles.startButton, isLoading && styles.startButtonDisabled]}
          onPress={handleCreateSession}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.startButtonText}>Start Counting</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Recent Sessions</Text>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.sessionList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No sessions found</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  newSessionCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newSessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  warehouseInput: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    flex: 1,
    padding: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sessionList: {
    paddingBottom: 20,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionWarehouse: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sessionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionInfo: {
    marginBottom: 12,
  },
  sessionInfoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resumeButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
});
