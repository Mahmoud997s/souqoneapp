import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { TopBarGlassSurface } from './TopBarGlassSurface';

export interface FilterGlassSurfaceProps {
  testID?: string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * FilterGlassSurface
 * Shared single-source component rendering liquid ice-glass backdrop layers
 * (backing iceGlass fill + GlassSurface blur/liquid layer) behind filter controls,
 * identical to compact navigation bar buttons (TopBarGlassSurface kind="ice-control").
 */
export function FilterGlassSurface({
  testID = 'filter-glass-surface',
  borderRadius,
  style,
}: FilterGlassSurfaceProps) {
  return (
    <TopBarGlassSurface
      testID={testID}
      kind="ice-control"
      borderRadius={borderRadius}
      style={style}
    />
  );
}
