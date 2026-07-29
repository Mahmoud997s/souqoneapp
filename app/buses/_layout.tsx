import { Tabs } from 'expo-router';
import React from 'react';
import { BusesTabBar } from '../../src/components/buses/navigation/BusesTabBar';

export default function BusesLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BusesTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="new" />
      <Tabs.Screen name="browse" />
      <Tabs.Screen name="[id]" options={{ tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
