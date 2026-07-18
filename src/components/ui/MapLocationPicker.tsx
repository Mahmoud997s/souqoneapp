import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { Spacing } from '../../constants/spacing';
import { AppButton } from './AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MapLocationPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  title?: string;
}

const MUSCAT_LAT = 23.5880;
const MUSCAT_LNG = 58.3829;

export function MapLocationPicker({
  isVisible,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  title = "تحديد الموقع على الخريطة"
}: MapLocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number, longitude: number } | null>(
    initialLat && initialLng ? { latitude: initialLat, longitude: initialLng } : null
  );
  const [region, setRegion] = useState<Region>({
    latitude: initialLat || MUSCAT_LAT,
    longitude: initialLng || MUSCAT_LNG,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isLoadingLoc, setIsLoadingLoc] = useState(false);

  // Sync initial props when opened
  useEffect(() => {
    if (isVisible) {
      if (initialLat && initialLng) {
        setSelectedLocation({ latitude: initialLat, longitude: initialLng });
        setRegion({
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        setSelectedLocation(null);
        getCurrentLocation();
      }
    }
  }, [isVisible, initialLat, initialLng]);

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLoc(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLoadingLoc(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSelectedLocation(newLoc);
      setRegion({
        ...newLoc,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (err) {
      console.warn("Could not fetch location", err);
    } finally {
      setIsLoadingLoc(false);
    }
  };

  const handleMapPress = (e: any) => {
    setSelectedLocation(e.nativeEvent.coordinate);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm(selectedLocation.latitude, selectedLocation.longitude);
      onClose();
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.closeBtn} /> 
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                pinColor={Colors.primary}
              />
            )}
          </MapView>
          
          <TouchableOpacity 
            style={styles.myLocationBtn}
            onPress={getCurrentLocation}
            disabled={isLoadingLoc}
          >
            {isLoadingLoc ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Ionicons name="locate" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {!selectedLocation ? (
            <Text style={styles.helpText}>يرجى النقر على الخريطة لتحديد الموقع بدقة</Text>
          ) : (
            <Text style={styles.helpText}>تم تحديد الموقع بنجاح</Text>
          )}
          <AppButton 
            title="تأكيد الموقع"
            onPress={handleConfirm}
            disabled={!selectedLocation}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  myLocationBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Colors.white,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  footer: {
    padding: Spacing.space4,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  helpText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  }
});
