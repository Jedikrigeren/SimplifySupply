import { useAuth } from '@/context/AuthContext';
import { useCountingSession } from '@/context/CountingSessionContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { sessions, loadAllSessions } = useCountingSession();

  useEffect(() => {
    loadAllSessions();
  }, []);

  const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'paused');
  const recentSessions = sessions.slice(0, 3);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.fullName || user?.username}</Text>
      </View>

      {activeSessions.length > 0 && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>⚠️ Active Sessions</Text>
          <Text style={styles.alertText}>
            You have {activeSessions.length} active counting session{activeSessions.length > 1 ? 's' : ''}.
          </Text>
          <Pressable
            style={styles.alertButton}
            onPress={() => router.push('/(tabs)/counting')}
          >
            <Text style={styles.alertButtonText}>View Sessions</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.quickActionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/counting')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Start Counting</Text>
            <Text style={styles.actionDescription}>Begin new inventory count</Text>
          </Pressable>
          
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/scanner')}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionTitle}>Scan Item</Text>
            <Text style={styles.actionDescription}>Scan barcode to view item</Text>
          </Pressable>
        </View>
      </View>

      {recentSessions.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Sessions</Text>
            <Pressable onPress={() => router.push('/(tabs)/counting')}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          {recentSessions.map((session) => (
            <View key={session.id} style={styles.sessionItem}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionWarehouse}>Warehouse {session.warehouse_code}</Text>
                <Text style={styles.sessionDate}>
                  {new Date(session.started_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[
                styles.sessionStatus,
                { backgroundColor: getStatusColor(session.status) }
              ]}>
                <Text style={styles.sessionStatusText}>{session.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Getting Started</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>1️⃣</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Create a Counting Session</Text>
            <Text style={styles.infoText}>Start a new session from the Counting tab</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>2️⃣</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Scan or Enter Items</Text>
            <Text style={styles.infoText}>Use the scanner or manually enter item codes</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>3️⃣</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Submit to SAP</Text>
            <Text style={styles.infoText}>Review and submit your count to SAP Business One</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: string) {
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  alertCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#78350f',
    marginBottom: 12,
  },
  alertButton: {
    backgroundColor: '#f59e0b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionWarehouse: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  sessionStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sessionStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  scannerButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  scannerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
