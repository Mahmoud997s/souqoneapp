import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';

export function useProfilePhoneGuard() {
  const { user } = useAuthStore();
  const [checking, setChecking] = useState(false);
  const userPhone = user?.phone;
  const hasPhone = Boolean(userPhone && typeof userPhone === 'string' && userPhone.trim().length > 0);

  const checkPhone = useCallback(async (): Promise<boolean> => {
    const currentPhone =
      typeof useAuthStore.getState === 'function'
        ? useAuthStore.getState().user?.phone
        : user?.phone;
    if (currentPhone && typeof currentPhone === 'string' && currentPhone.trim().length > 0) {
      return true;
    }
    setChecking(true);
    try {
      const res = await authApi.me();
      const data = res.data as any;
      const freshUser = data?.user ?? data;
      if (freshUser?.id) {
        if (typeof useAuthStore.getState === 'function') {
          useAuthStore.getState().updateUser?.(freshUser);
        }
        const p = freshUser.phone;
        return Boolean(p && typeof p === 'string' && p.trim().length > 0);
      }
    } catch {
      // fallback to store value
    } finally {
      setChecking(false);
    }
    return false;
  }, [user?.phone]);

  // Re-check whenever screen regains focus (e.g. returning from edit-profile)
  const focusEffect = typeof useFocusEffect === 'function' ? useFocusEffect : useEffect;
  focusEffect(
    useCallback(() => {
      checkPhone();
    }, [checkPhone])
  );

  return {
    hasPhone,
    checking,
    checkPhone,
    phone: userPhone || '',
  };
}
