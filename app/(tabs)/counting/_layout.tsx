import { Stack } from 'expo-router';
import React from 'react';

export default function CountingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#111827',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Inventory Counting',
        }}
      />
      <Stack.Screen
        name="active-session"
        options={{
          title: 'Active Session',
        }}
      />
    </Stack>
  );
}
