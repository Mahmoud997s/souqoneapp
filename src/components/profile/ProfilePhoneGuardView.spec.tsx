import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { ProfilePhoneGuardView } from './ProfilePhoneGuardView';
import { PROFILE_PHONE_REQUIRED_MESSAGE } from '../../utils/profilePhoneGuard';

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
    fireEvent.press(screen.getByLabelText('الرسائل'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/chat');
    fireEvent.press(screen.getByLabelText('الإشعارات'));
    expect(router.push).toHaveBeenCalledWith('/profile/notifications');

    fireEvent.press(screen.getByLabelText('رجوع'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
