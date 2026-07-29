import React from 'react';
import { Redirect } from 'expo-router';

export default function BusesFavoritesScreen() {
  // Redirect to the global favorites screen with the buses tab pre-selected
  return <Redirect href="/profile/favorites?tab=buses" />;
}
