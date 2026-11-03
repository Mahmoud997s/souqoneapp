import React from 'react';
import { View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { FilterGlassSurface } from '../FilterGlassSurface';
import { TopBarTokens } from '../../../constants/topBarTokens';

jest.mock('../../navigation/glassSupport', () => ({ GlassSurface: 'GlassSurface' }));

describe('FilterGlassSurface', () => {
  it('renders ice-control backing and GlassSurface with correct tokens and borderRadius', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <FilterGlassSurface testID="test-chip-glass" borderRadius={20} />
      );
    });

    const backing = renderer!.root.findByProps({ testID: 'test-chip-glass-backing' });
    const glass = renderer!.root.findByType('GlassSurface' as never);

    expect(backing).toBeDefined();
    expect(glass).toBeDefined();

    expect(backing.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: TopBarTokens.iceGlass,
          borderRadius: 20,
        }),
      ])
    );

    expect(glass.props).toMatchObject({
      washColor: TopBarTokens.iceGlass,
      borderRadius: 20,
      intensity: TopBarTokens.blurIntensity,
    });
  });

  it('keeps glass surface outside any reduced-opacity ancestor', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <View style={{ flex: 1 }}>
          <FilterGlassSurface testID="safe-chip-glass" borderRadius={8} />
        </View>
      );
    });

    const glass = renderer!.root.findByType('GlassSurface' as never);
    let ancestor = glass.parent;
    while (ancestor) {
      const styles = Array.isArray(ancestor.props.style)
        ? ancestor.props.style.flat(Infinity)
        : [ancestor.props.style];
      expect(styles).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ opacity: expect.any(Number) }),
        ])
      );
      ancestor = ancestor.parent;
    }
  });
});
