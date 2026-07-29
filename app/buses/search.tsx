import React from 'react';
import { Redirect } from 'expo-router';

export default function BusesSearchScreen() {
  // Redirect to the browse screen where the search bar and filters are located
  return <Redirect href="/buses/browse" />;
}
