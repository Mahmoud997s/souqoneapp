import React from 'react';
import fs from 'fs';
import path from 'path';
import { StyleSheet } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { ProfilePhoneGuardView } from './ProfilePhoneGuardView';
import { PROFILE_PHONE_REQUIRED_MESSAGE } from '../../utils/profilePhoneGuard';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
}));

describe('ProfilePhoneGuardView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    ['glass', 'إضافة إعلان سيارة'],
    ['app', 'إضافة إعلان'],
  ] as const)('headerVariant=%s', (variant, title) => {
    it('renders the three testIDs, the copy, and exactly one header title', async () => {
      await render(<ProfilePhoneGuardView title={title} headerVariant={variant} />);

      expect(screen.getByTestId('profile-phone-guard-view')).toBeTruthy();
      expect(screen.getByTestId('guard-add-phone-btn')).toBeTruthy();
      expect(screen.getByTestId('guard-back-btn')).toBeTruthy();

      expect(screen.getByText('أضف رقم هاتفك الأول')).toBeTruthy();
      expect(screen.getByText(PROFILE_PHONE_REQUIRED_MESSAGE)).toBeTruthy();
      expect(screen.getByText('يظهر رقمك للمشتري فقط عند ضغطه على اتصال أو واتساب')).toBeTruthy();

      // No duplicated header: the title must be rendered once.
      expect(screen.getAllByText(title)).toHaveLength(1);
    });

    it('add-phone button navigates to /profile/edit-profile', async () => {
      await render(<ProfilePhoneGuardView title={title} headerVariant={variant} />);
      fireEvent.press(screen.getByTestId('guard-add-phone-btn'));
      expect(router.push).toHaveBeenCalledWith('/profile/edit-profile');
    });

    it('back button calls onBack when provided, otherwise router.back', async () => {
      const onBack = jest.fn();
      await render(<ProfilePhoneGuardView title={title} headerVariant={variant} onBack={onBack} />);
      fireEvent.press(screen.getByTestId('guard-back-btn'));
      expect(onBack).toHaveBeenCalledTimes(1);
      expect(router.back).not.toHaveBeenCalled();
    });
  });

  it('app: uses AppHeader (no glass actions)', async () => {
    const onBack = jest.fn();
    await render(<ProfilePhoneGuardView title="إضافة إعلان" headerVariant="app" onBack={onBack} />);

    expect(screen.queryByLabelText('الرسائل')).toBeNull();
    expect(screen.queryByLabelText('الإشعارات')).toBeNull();
    expect(screen.queryByLabelText('رجوع')).toBeNull();
    expect(screen.getAllByText('إضافة إعلان')).toHaveLength(1);
  });

  it('defaults to the app header variant when headerVariant is omitted', async () => {
    await render(<ProfilePhoneGuardView title="إضافة إعلان" />);
    expect(screen.queryByLabelText('الرسائل')).toBeNull();
    expect(screen.getAllByText('إضافة إعلان')).toHaveLength(1);
  });

  it('glass: renders GlassNavBar with back + messages + notifications actions', async () => {
    await render(<ProfilePhoneGuardView title="إضافة حافلة" headerVariant="glass" />);

    expect(screen.getAllByLabelText('رجوع')).toHaveLength(1);
    await fireEvent.press(screen.getByLabelText('الرسائل'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/chat');
    await fireEvent.press(screen.getByLabelText('الإشعارات'));
    expect(router.push).toHaveBeenCalledWith('/profile/notifications');

    await fireEvent.press(screen.getByLabelText('رجوع'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  describe('D-378: wizard look (Colors.homeBg + solid Colors.surface card, no gradient/orbs/card GlassSurface) and centered layout', () => {
    it.each(['glass', 'app'] as const)(
      '%s variant uses Colors.homeBg root, solid Colors.surface wizard card, and no card GlassSurface',
      async (variant) => {
        await render(
          <ProfilePhoneGuardView title="إضافة إعلان" headerVariant={variant} />
        );

        const rootStyle = StyleSheet.flatten(screen.getByTestId('profile-phone-guard-view').props.style);
        expect(rootStyle.backgroundColor).toBe(Colors.homeBg);

        const cardStyle = StyleSheet.flatten(screen.getByTestId('profile-phone-guard-card').props.style);
        expect(cardStyle.backgroundColor).toBe(Colors.surface);
        expect(cardStyle.borderColor).toBe(Colors.border);
        expect(cardStyle.borderWidth).toBe(1);
        expect(cardStyle.borderRadius).toBe(Radius.lg);
        expect(cardStyle.position).not.toBe('absolute');

        expect(screen.queryByTestId('profile-phone-guard-glass-surface')).toBeNull();
      }
    );

    it.each(['glass', 'app'] as const)(
      '%s variant centers the card via ScrollView contentContainerStyle (flexGrow: 1, justifyContent: center, alignItems: center)',
      async (variant) => {
        await render(
          <ProfilePhoneGuardView title="إضافة إعلان" headerVariant={variant} />
        );

        const scroll = screen.getByTestId('profile-phone-guard-scroll');
        const contentStyle = StyleSheet.flatten(scroll.props.contentContainerStyle);
        expect(contentStyle.flexGrow).toBe(1);
        expect(contentStyle.justifyContent).toBe('center');
        expect(contentStyle.alignItems).toBe('center');
      }
    );

    it('removes LinearGradient, decorative orb views, and GlassSurface from ProfilePhoneGuardView source', () => {
      const src = fs.readFileSync(
        path.resolve(__dirname, 'ProfilePhoneGuardView.tsx'),
        'utf8'
      );
      expect(src).not.toContain('LinearGradient');
      expect(src).not.toContain('GlassSurface');
      expect(src).not.toContain('orbPrimary');
      expect(src).not.toContain('orbAccent');
      expect(src).not.toContain('BottomBarTokens');
    });
  });
});
