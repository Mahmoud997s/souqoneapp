import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapView = forwardRef((props: any, ref) => {
  useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
  }));

  return (
    <View style={[styles.container, props.style]}>
      <Text style={styles.text}>الخريطة غير مدعومة في المتصفح</Text>
      {props.children}
    </View>
  );
});

const Marker = (props: any) => null;
const PROVIDER_GOOGLE = 'google';

export type Region = any;

export { MapView, Marker, PROVIDER_GOOGLE };
export default MapView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  text: {
    fontFamily: 'Almarai_700Bold',
    color: '#6B7280',
  }
});
