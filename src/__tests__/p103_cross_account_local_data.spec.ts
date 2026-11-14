import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { queryClient } from '../api/queryClient';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/authStore';
import { usePartWizardStore } from '../store/partWizardStore';
import { useServiceWizardStore } from '../store/serviceWizardStore';
import { useCarWizardStore } from '../store/carWizardStore';
import { useBusWizardStore } from '../store/busWizardStore';
import { useEquipmentWizardStore } from '../store/equipmentWizardStore';
import { useOperatorWizardStore } from '../store/operatorWizardStore';
import { usePostStore } from '../store/postStore';
import { usePinStore } from '../store/pinStore';
import { useArchiveStore } from '../store/archiveStore';
import { useChatMessagesStore } from '../store/chatMessagesStore';
import { clearAllUserData } from '../utils/clearUserData';
import type { User } from '../types/auth.types';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../services/socket', () => ({
  disconnectSocket: jest.fn(),
}));

jest.mock('../api/users', () => ({
  usersApi: {
    unregisterPushToken: jest.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

jest.mock('../api/auth', () => ({
  authApi: {
    logout: jest.fn().mockResolvedValue({ data: { success: true } }),
    me: jest.fn(),
  },
}));

const LAST_USER_ID_KEY = '@souqone_last_user_id';
const RECENT_SEARCHES_KEY = '@souqone_recent_searches';

const DRAFT_PERSIST_KEYS = [
  'part-wizard-draft',
  'service-wizard-draft',
  'car-wizard-storage',
  'bus-wizard-storage',
  'souqone_equipment_wizard_draft',
  'souqone_operator_wizard_draft',
  'post-draft-storage',
  'archive-storage',
  'pinned-chat-storage',
  'chat-messages-storage',
  RECENT_SEARCHES_KEY,
] as const;

const makeUser = (id: string): User => ({
  id,
  email: `${id}@example.com`,
  username: id,
  role: 'user',
  isVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  deletionScheduledAt: null,
});

async function seedAllLocalDraftsAndHistory() {
  usePartWizardStore.getState().setField('title', 'فلتر زيت تويوتا مسودة خاصة بالحساب');
  usePartWizardStore.getState().goToStep(2);

  useServiceWizardStore.getState().setField('title', 'خدمة صيانة محرك مسودة خاصة بالحساب');
  useServiceWizardStore.getState().goToStep(3);

  useCarWizardStore.getState().updateField('title', 'سيارة للمسودة');
  useBusWizardStore.getState().setData({ title: 'حافلة للمسودة' });
  useEquipmentWizardStore.getState().setFormField('title', 'معدة للمسودة');
  useOperatorWizardStore.getState().setFormField('title', 'مشغل للمسودة');
  usePostStore.getState().set({ title: 'مسودة إعلان عام' });
  if (!usePinStore.getState().isPinned('room-1')) {
    usePinStore.getState().togglePin('room-1');
  }
  if (!useArchiveStore.getState().isArchived('room-2')) {
    useArchiveStore.getState().toggleArchive('room-2');
  }
  useChatMessagesStore.setState({
    messagesByRoom: {
      'room-1': [
        {
          id: 'msg-1',
          senderId: 'user-1',
          content: 'رسالة تجريبية',
          type: 'TEXT',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
  });

  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['كمبريسر مكيف', 'حفار كوماتسو']));
  await AsyncStorage.setItem('part-wizard-draft', JSON.stringify({ state: { formData: { title: 'مسودة قطع' } } }));
  await AsyncStorage.setItem('service-wizard-draft', JSON.stringify({ state: { formData: { title: 'مسودة خدمة' } } }));
  queryClient.setQueryData(['parts', 'my'], [{ id: 'stale-part-1' }]);
}

function assertAllStoresAndStorageCleared() {
  expect(usePartWizardStore.getState().formData.title).toBe('');
  expect(usePartWizardStore.getState().currentStep).toBe(1);
  expect(useServiceWizardStore.getState().formData.title).toBe('');
  expect(useServiceWizardStore.getState().currentStep).toBe(1);
  expect(useCarWizardStore.getState().formData.title).toBe('');
  expect(useBusWizardStore.getState().data.title).toBe('');
  expect(useEquipmentWizardStore.getState().formData.title).toBe('');
  expect(useOperatorWizardStore.getState().formData.title).toBe('');
  expect(usePostStore.getState().title).toBe('');
  expect(usePinStore.getState().pinnedIds).toEqual([]);
  expect(useArchiveStore.getState().archivedIds).toEqual([]);
  expect(useChatMessagesStore.getState().messagesByRoom).toEqual({});
  expect(queryClient.getQueryData(['parts', 'my'])).toBeUndefined();
}

describe('Cross-Account Local Drafts & History Isolation (P1-03 / D-321)', () => {
  const secureStoreMap = new Map<string, string>();

  beforeEach(async () => {
    jest.clearAllMocks();
    secureStoreMap.clear();
    await AsyncStorage.clear();
    queryClient.clear();

    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(secureStoreMap.get(key) ?? null)
    );
    (SecureStore.setItemAsync as jest.Mock).mockImplementation((key: string, val: string) => {
      secureStoreMap.set(key, val);
      return Promise.resolve();
    });
    (SecureStore.deleteItemAsync as jest.Mock).mockImplementation((key: string) => {
      secureStoreMap.delete(key);
      return Promise.resolve();
    });

    useAuthStore.setState({ user: null, isLoggedIn: false, isGuest: false, isLoading: false });
  });

  it('clearAllUserData() resets all 10 Zustand stores (including Part & Service) and wipes recent searches + draft AsyncStorage keys', async () => {
    secureStoreMap.set('accessToken', 'token-u1');
    secureStoreMap.set('refreshToken', 'refresh-u1');
    await seedAllLocalDraftsAndHistory();

    await clearAllUserData();

    expect(usersApi.unregisterPushToken).toHaveBeenCalledTimes(1);
    expect(secureStoreMap.has('accessToken')).toBe(false);
    expect(secureStoreMap.has('refreshToken')).toBe(false);

    assertAllStoresAndStorageCleared();

    for (const key of DRAFT_PERSIST_KEYS) {
      expect(await AsyncStorage.getItem(key)).toBeNull();
    }
  });

  it('setAuth() switching from user-1 to user-2 wipes leaked drafts & search history WITHOUT deleting user-2 new tokens', async () => {
    await useAuthStore.getState().setAuth(makeUser('user-1'), 'access-u1', 'refresh-u1');
    expect(await AsyncStorage.getItem(LAST_USER_ID_KEY)).toBe('user-1');

    // Simulate leftover persisted drafts/history (e.g. partial cleanup or pre-fix logout) before switching to user-2
    await seedAllLocalDraftsAndHistory();

    await useAuthStore.getState().setAuth(makeUser('user-2'), 'access-u2', 'refresh-u2');

    // New user-2 tokens MUST remain intact in SecureStore!
    expect(secureStoreMap.get('accessToken')).toBe('access-u2');
    expect(secureStoreMap.get('refreshToken')).toBe('refresh-u2');
    expect(useAuthStore.getState().user?.id).toBe('user-2');
    expect(useAuthStore.getState().isLoggedIn).toBe(true);
    expect(await AsyncStorage.getItem(LAST_USER_ID_KEY)).toBe('user-2');

    // Drafts & recent search history from user-1 MUST be cleared
    assertAllStoresAndStorageCleared();
    for (const key of DRAFT_PERSIST_KEYS) {
      expect(await AsyncStorage.getItem(key)).toBeNull();
    }
  });

  it('setAuth() logging back into the SAME user-1 preserves local drafts & recent searches', async () => {
    await useAuthStore.getState().setAuth(makeUser('user-1'), 'access-u1', 'refresh-u1');
    await seedAllLocalDraftsAndHistory();

    await useAuthStore.getState().setAuth(makeUser('user-1'), 'access-u1-refreshed', 'refresh-u1-refreshed');

    expect(secureStoreMap.get('accessToken')).toBe('access-u1-refreshed');
    expect(secureStoreMap.get('refreshToken')).toBe('refresh-u1-refreshed');
    expect(usePartWizardStore.getState().formData.title).toBe('فلتر زيت تويوتا مسودة خاصة بالحساب');
    expect(useServiceWizardStore.getState().formData.title).toBe('خدمة صيانة محرك مسودة خاصة بالحساب');
    expect(await AsyncStorage.getItem(RECENT_SEARCHES_KEY)).toBe(
      JSON.stringify(['كمبريسر مكيف', 'حفار كوماتسو'])
    );
  });

  it('initialize() clears stale local drafts if stored @souqone_last_user_id belongs to a different user', async () => {
    secureStoreMap.set('accessToken', 'token-u2');
    await AsyncStorage.setItem(LAST_USER_ID_KEY, 'user-1');
    await seedAllLocalDraftsAndHistory();
    (authApi.me as jest.Mock).mockResolvedValue({ data: { user: makeUser('user-2') } });

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().user?.id).toBe('user-2');
    expect(await AsyncStorage.getItem(LAST_USER_ID_KEY)).toBe('user-2');
    expect(secureStoreMap.get('accessToken')).toBe('token-u2');
    assertAllStoresAndStorageCleared();
    expect(await AsyncStorage.getItem(RECENT_SEARCHES_KEY)).toBeNull();
  });
});
