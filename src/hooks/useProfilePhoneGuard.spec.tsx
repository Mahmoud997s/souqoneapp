import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { useProfilePhoneGuard } from './useProfilePhoneGuard';
import {
  isProfilePhoneRequiredError,
  promptProfilePhoneRequired,
  PROFILE_PHONE_REQUIRED_CODE,
} from '../utils/profilePhoneGuard';
import { ProfilePhoneGuardView } from '../components/profile/ProfilePhoneGuardView';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { dialogService } from '../store/dialogStore';
import { router } from 'expo-router';

jest.mock('../api/auth', () => ({
  authApi: {
    me: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
  useFocusEffect: (cb: any) => {
    // mock as no-op inside test unless explicitly triggered
  },
}));

jest.mock('../store/dialogStore', () => ({
  dialogService: {
    confirm: jest.fn(),
    alert: jest.fn(),
  },
}));

async function renderPhoneGuardHook() {
  let hookResult: ReturnType<typeof useProfilePhoneGuard> | undefined;
  function Consumer() {
    hookResult = useProfilePhoneGuard();
    return null;
  }
  await render(<Consumer />);
  return {
    get current() {
      return hookResult!;
    },
  };
}

describe('Profile Phone Guard & Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, isLoggedIn: false });
  });

  describe('isProfilePhoneRequiredError', () => {
    it('detects PROFILE_PHONE_REQUIRED from response.data.code', () => {
      const error = {
        response: {
          data: {
            code: PROFILE_PHONE_REQUIRED_CODE,
            message: 'لازم تضيف رقم هاتفك في بروفايلك الأول',
          },
        },
      };
      expect(isProfilePhoneRequiredError(error)).toBe(true);
    });

    it('detects PROFILE_PHONE_REQUIRED from nested message.code', () => {
      const error = {
        response: {
          data: {
            message: {
              code: PROFILE_PHONE_REQUIRED_CODE,
            },
          },
        },
      };
      expect(isProfilePhoneRequiredError(error)).toBe(true);
    });

    it('detects PROFILE_PHONE_REQUIRED from arabic error message substring', () => {
      const error = {
        response: {
          data: {
            message: 'لازم تضيف رقم هاتفك في بروفايلك الأول عشان المشترين يقدروا يتواصلوا معاك',
          },
        },
      };
      expect(isProfilePhoneRequiredError(error)).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      const error = {
        response: {
          data: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
          },
        },
      };
      expect(isProfilePhoneRequiredError(error)).toBe(false);
      expect(isProfilePhoneRequiredError(null)).toBe(false);
    });
  });

  describe('promptProfilePhoneRequired', () => {
    it('shows confirmation dialog and navigates to /profile/edit-profile on accept', () => {
      promptProfilePhoneRequired();

      expect(dialogService.confirm).toHaveBeenCalledWith(
        'إضافة رقم الهاتف مطلوبة',
        expect.stringContaining('لازم تضيف رقم هاتفك'),
        expect.any(Function),
        'أضف رقمك',
        'إلغاء'
      );

      const onConfirm = (dialogService.confirm as jest.Mock).mock.calls[0][2];
      onConfirm();
      expect(router.push).toHaveBeenCalledWith('/profile/edit-profile');
    });
  });

  describe('useProfilePhoneGuard hook', () => {
    it('returns hasPhone: false when user has no phone', async () => {
      useAuthStore.setState({ user: { id: 'u1', username: 'test' } as any });
      const hook = await renderPhoneGuardHook();
      expect(hook.current.hasPhone).toBe(false);
    });

    it('returns hasPhone: true when user has phone', async () => {
      useAuthStore.setState({ user: { id: 'u1', username: 'test', phone: '+96891234567' } as any });
      const hook = await renderPhoneGuardHook();
      expect(hook.current.hasPhone).toBe(true);
    });

    it('updates hasPhone after checkPhone fetches user with phone', async () => {
      useAuthStore.setState({ user: { id: 'u1', username: 'test' } as any });
      (authApi.me as jest.Mock).mockResolvedValueOnce({
        data: {
          user: { id: 'u1', username: 'test', phone: '96899999999' },
        },
      });

      const hook = await renderPhoneGuardHook();
      expect(hook.current.hasPhone).toBe(false);

      await act(async () => {
        const valid = await hook.current.checkPhone();
        expect(valid).toBe(true);
      });

      expect(hook.current.hasPhone).toBe(true);
    });
  });

  describe('ProfilePhoneGuardView component', () => {
    it('renders requirement message and handles navigation', async () => {
      await render(<ProfilePhoneGuardView title="إضافة إعلان" />);

      expect(screen.getByText('أضف رقم هاتفك الأول')).toBeTruthy();
      expect(
        screen.getByText('لازم تضيف رقم هاتفك في بروفايلك الأول عشان المشترين يقدروا يتواصلوا معاك')
      ).toBeTruthy();

      fireEvent.press(screen.getByTestId('guard-add-phone-btn'));
      expect(router.push).toHaveBeenCalledWith('/profile/edit-profile');

      fireEvent.press(screen.getByTestId('guard-back-btn'));
      expect(router.back).toHaveBeenCalled();
    });
  });
});
