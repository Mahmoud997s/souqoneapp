import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import RNMapView, {
  Marker,
  PROVIDER_GOOGLE,
  Region,
  MapViewProps,
} from 'react-native-maps';

export const GOOGLE_MAPS_API_KEY = 'AIzaSyDT7aik5y9KetS55fp-HsQbj2t0shJVHU8';

/**
 * Enhanced MapView with platform-safe provider resolution:
 * - Android: Uses Google Maps (PROVIDER_GOOGLE) with the configured API Key.
 * - iOS: Uses native Apple Maps (provider=undefined) by default, eliminating gray boxes
 *   caused by missing/unlinked GoogleMaps CocoaPods while keeping full map rendering.
 */
const MapView = forwardRef<RNMapView, MapViewProps>((props, ref) => {
  const provider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
  return <RNMapView ref={ref} {...props} provider={provider} />;
});

MapView.displayName = 'MapView';

export { MapView, Marker, PROVIDER_GOOGLE };
export type { Region, MapViewProps };
export default MapView;
