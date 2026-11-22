import React from 'react';
import fs from 'fs';
import path from 'path';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AddListingButton } from '../../components/navigation/AddListingButton';
import { UnifiedBottomBar, type BottomBarTabItem } from '../../components/navigation/UnifiedBottomBar';
import { CustomTabBar } from '../../../app/(tabs)/_layout';
import { BottomBarTokens } from '../../constants/bottomBarTokens';
import { Colors } from '../../constants/colors';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  Tabs: Object.assign(() => null, { Screen: () => null }),
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ isLoggedIn: true }),
}));

const SECTION_TABS: BottomBarTabItem[] = [
  { id: 'home', label: 'الرئيسية', icon: 'home', iconOutline: 'home-outline' },
  { id: 'post', isPost: true },
  { id: 'chat', label: 'الرسائل', icon: 'chatbubble', iconOutline: 'chatbubble-outline' },
];

function makeHomeTabBarProps() {
  const routes = [
    { key: 'index-1', name: 'index' },
    { key: 'search-2', name: 'search' },
    { key: 'post-3', name: 'post' },
    { key: 'chat-4', name: 'chat' },
    { key: 'profile-5', name: 'profile' },
  ];
  const descriptors: Record<string, { options: Record<string, unknown> }> = {};
  for (const r of routes) {
    descriptors[r.key] = { options: {} };
  }
  return {
    state: { index: 0, routes },
    descriptors,
    navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() },
  } as unknown as Parameters<typeof CustomTabBar>[0];
}

describe('D-380 Part 1: Unified AddListingButton (squircle, two-view shadow/clip separation, pressed state)', () => {
  it('both CustomTabBar and UnifiedBottomBar import and render the SAME shared AddListingButton component with identical 40pt squircle styles', async () => {
    const root = path.resolve(__dirname, '../../..');
    const homeSrc = fs.readFileSync(path.join(root, 'app/(tabs)/_layout.tsx'), 'utf8');
    const sectionSrc = fs.readFileSync(path.join(root, 'src/components/navigation/UnifiedBottomBar.tsx'), 'utf8');

    expect(homeSrc).toContain("from '../../src/components/navigation/AddListingButton'");
    expect(sectionSrc).toContain("from './AddListingButton'");
    expect(homeSrc).not.toContain('fabCircle');
    expect(sectionSrc).not.toContain('fabSquircleWrap');

    const homeRender = await render(<CustomTabBar {...makeHomeTabBarProps()} />);
    const homeShadowStyle = StyleSheet.flatten(homeRender.getByTestId('tab-post-fab-shadow').props.style);
    const homeFaceStyle = StyleSheet.flatten(homeRender.getByTestId('tab-post-fab-face').props.style);

    const sectionRender = await render(
      <UnifiedBottomBar
        tabs={SECTION_TABS}
        activeTab="home"
        onTabPress={jest.fn()}
        onPostPress={jest.fn()}
      />
    );
    const sectionShadowStyle = StyleSheet.flatten(
      sectionRender.getByTestId('section-bottom-bar-add-button-shadow').props.style
    );
    const sectionFaceStyle = StyleSheet.flatten(
      sectionRender.getByTestId('section-bottom-bar-add-button-face').props.style
    );

    // Identical 40pt squircle (NOT a 38pt circle!)
    expect(homeShadowStyle.width).toBe(40);
    expect(homeShadowStyle.height).toBe(40);
    expect(homeShadowStyle.borderRadius).toBe(BottomBarTokens.addButtonRadius);
    expect(homeShadowStyle.borderRadius).not.toBe(19);
    expect(homeShadowStyle).toEqual(sectionShadowStyle);
    expect(homeFaceStyle).toEqual(sectionFaceStyle);
  });

  it('separates outer shadow view (no overflow hidden, no white border) from inner clipped face view (overflow hidden, no dark bottom edge)', async () => {
    const { getByTestId, queryByTestId } = await render(
      <AddListingButton
        onPress={jest.fn()}
        testID="section-bottom-bar-add-button"
        accessibilityLabel="إضافة إعلان جديد"
      />
    );

    const outer = getByTestId('section-bottom-bar-add-button-shadow');
    const inner = getByTestId('section-bottom-bar-add-button-face');
    expect(outer).not.toBe(inner);

    const outerStyle = StyleSheet.flatten(outer.props.style);
    expect(outerStyle.backgroundColor).toBe(Colors.primary);
    expect(outerStyle.borderRadius).toBe(BottomBarTokens.addButtonRadius);
    expect(outerStyle.overflow).toBeUndefined();
    expect(outerStyle.borderWidth).toBeUndefined();
    expect(outerStyle.borderColor).toBeUndefined();
    expect(outerStyle.shadowColor ?? outerStyle.elevation).toBeTruthy();

    const innerStyle = StyleSheet.flatten(inner.props.style);
    expect(innerStyle.overflow).toBe('hidden');
    expect(innerStyle.borderRadius).toBe(BottomBarTokens.addButtonRadius);
    expect(innerStyle.borderBottomWidth).toBeUndefined();
    expect(innerStyle.borderBottomColor).toBeUndefined();

    // Old emboss rim removed
    expect(queryByTestId('section-bottom-bar-add-button-emboss')).toBeNull();
  });

  it('applies pressed sink + tightened shadow + darker turquoise overlay (no navy) on pressIn and fires onPress', async () => {
    const onPress = jest.fn();
    const { getByTestId, queryByTestId } = await render(
      <AddListingButton
        onPress={onPress}
        testID="tab-post-fab"
        accessibilityLabel="إضافة إعلان"
      />
    );

    const btn = getByTestId('tab-post-fab');
    expect(btn.props.accessibilityLabel).toBe('إضافة إعلان');
    expect(btn.props.accessibilityRole).toBe('button');
    expect(queryByTestId('tab-post-fab-pressed-overlay')).toBeNull();

    await fireEvent(btn, 'pressIn');
    const pressedOuterStyle = StyleSheet.flatten(getByTestId('tab-post-fab-shadow').props.style);
    expect(pressedOuterStyle.transform).toEqual([{ translateY: 1 }]);
    expect(pressedOuterStyle.backgroundColor).not.toBe(Colors.primaryDark);

    const overlayStyle = StyleSheet.flatten(getByTestId('tab-post-fab-pressed-overlay').props.style);
    expect(overlayStyle.backgroundColor).toBe(BottomBarTokens.addButtonPressedOverlayColor);
    expect(overlayStyle.backgroundColor).not.toBe(Colors.primaryDark);

    await fireEvent(btn, 'pressOut');
    expect(queryByTestId('tab-post-fab-pressed-overlay')).toBeNull();

    await fireEvent.press(btn);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
