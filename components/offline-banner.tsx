import { useNetworkStatus } from '@/hooks/use-network-status';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetworkStatus();

  // Show banner if explicitly disconnected or no internet
  const isOffline = isConnected === false || isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        {isConnected === false 
          ? '📡 No network connection'
          : '🌐 No internet connection'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
