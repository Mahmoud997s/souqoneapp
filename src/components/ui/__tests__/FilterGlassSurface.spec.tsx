import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { FilterGlassSurface } from '../FilterGlassSurface';
import { TopBarTokens } from '../../../constants/topBarTokens';
import { VisualFiltersBase } from '../VisualFiltersBase';
import { BrowseResultsBar } from '../BrowseResultsBar';

jest.mock('../../navigation/glassSupport', () => ({ GlassSurface: 'GlassSurface' }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

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

  it('asserts no FilterGlassSurface has a TouchableOpacity ancestor in VisualFiltersBase (cards, view-all)', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <VisualFiltersBase
          tabs={[
            {
              id: 'all',
              label: 'الكل',
              items: [
                { id: '1', label: 'عنصر 1', isSelected: false },
                { id: '2', label: 'عنصر 2', isSelected: false },
              ],
            },
          ]}
          defaultTab="all"
          onViewAll={jest.fn()}
        />
      );
    });

    const surfaces = renderer!.root.findAllByType(FilterGlassSurface);
    expect(surfaces.length).toBeGreaterThan(0);

    for (const surface of surfaces) {
      let ancestor = surface.parent;
      while (ancestor) {
        expect(ancestor.type).not.toBe(TouchableOpacity);
        ancestor = ancestor.parent;
      }
    }
  });

  it('asserts no FilterGlassSurface has a TouchableOpacity ancestor in BrowseResultsBar (clear button)', () => {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <BrowseResultsBar
          resultsCount={10}
          entityName="سيارة"
          activeFiltersCount={2}
          onClearAll={jest.fn()}
        />
      );
    });

    const surfaces = renderer!.root.findAllByType(FilterGlassSurface);
    expect(surfaces.length).toBe(2); // count chip + clear button

    for (const surface of surfaces) {
      let ancestor = surface.parent;
      while (ancestor) {
        expect(ancestor.type).not.toBe(TouchableOpacity);
        ancestor = ancestor.parent;
      }
    }
  });
});
