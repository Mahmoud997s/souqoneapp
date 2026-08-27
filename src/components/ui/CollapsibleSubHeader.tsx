import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { useNavVisibility } from '../../context/NavVisibilityContext';

export interface CollapsibleSubHeaderProps {
  children: React.ReactNode;
  height?: number;
  isTransparent?: boolean;
}

export function CollapsibleSubHeader({ children, height = 85, isTransparent = false }: CollapsibleSubHeaderProps) {
  const { navHidden } = useNavVisibility();

  const collapsibleStyle = useAnimatedStyle(() => {
    // جعل الاستجابة لحظية (تختفي فوراً عند بداية النزول)
    const animatedHeight = interpolate(navHidden.value, [0, 0.1, 1], [height, 0, 0], Extrapolation.CLAMP);
    const opacity = interpolate(navHidden.value, [0, 0.1, 1], [1, 0, 0], Extrapolation.CLAMP);
    return {
      height: animatedHeight,
      opacity,
      overflow: 'hidden'
    };
  });

  return (
    <Animated.View style={[collapsibleStyle, s.container, isTransparent && s.transparentContainer]}>
      {children}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9'
  },
  transparentContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  }
});
