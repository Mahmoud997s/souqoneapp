import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { UnifiedBottomBar, type BottomBarTabItem } from '../components/navigation/UnifiedBottomBar';
import { BottomBarTokens } from '../constants/bottomBarTokens';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const TABS: BottomBarTabItem[] = [
  { id: 'home', label: 'الرئيسية', icon: 'home', iconOutline: 'home-outline' },
  { id: 'post', isPost: true },
  { id: 'chat', label: 'الرسائل', icon: 'chatbubble', iconOutline: 'chatbubble-outline' },
];

describe('D-360/D-380: UnifiedBottomBar centre add button 40px squircle with clean two-view shadow/face', () => {
  it('sets BottomBarTokens.addButtonSize to 40, proportional squircle radius, and renders two-view shadow/face while keeping bar height 52', async () => {
    expect(BottomBarTokens.addButtonSize).toBe(40);
    expect(BottomBarTokens.addButtonRadius).toBeCloseTo(13.7, 1);
    expect(BottomBarTokens.expandedHeight).toBe(52);
    expect(BottomBarTokens.expandedRadius).toBe(26);

    const { getByTestId, queryByTestId } = await render(
      <UnifiedBottomBar
        tabs={TABS}
        activeTab="home"
        onTabPress={jest.fn()}
        onPostPress={jest.fn()}
      />
    );

    const btn = getByTestId('section-bottom-bar-add-button');
    expect(btn.props.accessibilityLabel).toBe('إضافة إعلان جديد');

    const outer = StyleSheet.flatten(getByTestId('section-bottom-bar-add-button-shadow').props.style);
    expect(outer.overflow).toBeUndefined();
    expect(outer.borderWidth).toBeUndefined();
    expect(queryByTestId('section-bottom-bar-add-button-emboss')).toBeNull();
  });
});
