import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const mockLogout = jest.fn();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      logout: mockLogout,
    }),
  },
}));

jest.mock('../../store/dialogStore', () => ({
  dialogService: {
    alert: jest.fn(),
  },
}));

jest.mock('../../services/socket', () => ({
  socketService: {
    refreshTokenAndReconnect: jest.fn(),
  },
}));

// Import apiClient after mocks are set up
import { apiClient } from '../client';

describe('Auth Interceptor & Token Refresh Mechanism', () => {
  let axiosPostSpy: jest.SpyInstance;
  let secureStoreState: Record<string, string> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    secureStoreState = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    (SecureStore.getItemAsync as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve(secureStoreState[key] ?? null);
    });

    (SecureStore.setItemAsync as jest.Mock).mockImplementation((key: string, val: string) => {
      secureStoreState[key] = val;
      return Promise.resolve();
    });

    axiosPostSpy = jest.spyOn(axios, 'post');
  });

  afterEach(() => {
    axiosPostSpy.mockRestore();
  });

  it('1. should perform a single-flight refresh for concurrent 401 requests and retry all of them', async () => {
    let refreshCalls = 0;
    axiosPostSpy.mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        refreshCalls++;
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
              },
            });
          }, 50);
        });
      }
      return Promise.reject(new Error('Unknown POST'));
    });

    let attemptCounts: Record<string, number> = { '/items/1': 0, '/items/2': 0, '/items/3': 0 };

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const url = config.url || '';
      attemptCounts[url] = (attemptCounts[url] || 0) + 1;

      // Fail with 401 on first attempt, succeed on retry with new token
      if (attemptCounts[url] === 1) {
        const error = new AxiosError('Unauthorized', '401', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Token expired' },
          headers: {},
          config,
        });
        throw error;
      }

      return {
        data: { id: url, token: config.headers?.Authorization },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    // Fire 3 concurrent requests
    const [res1, res2, res3] = await Promise.all([
      apiClient.get('/items/1'),
      apiClient.get('/items/2'),
      apiClient.get('/items/3'),
    ]);

    expect(refreshCalls).toBe(1);
    expect(res1.data.token).toBe('Bearer new-access-token');
    expect(res2.data.token).toBe('Bearer new-access-token');
    expect(res3.data.token).toBe('Bearer new-access-token');
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('2. should NOT logout on refresh network error and leave tokens intact', async () => {
    axiosPostSpy.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('Unauthorized', '401', config, null, {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config,
      });
    };

    await expect(apiClient.get('/profile')).rejects.toThrow();

    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('3. should logout exactly ONCE if refresh endpoint returns 401', async () => {
    const refresh401Error = new AxiosError('Invalid refresh token', '401', undefined, null, {
      status: 401,
      statusText: 'Unauthorized',
      data: { message: 'Refresh token revoked' },
      headers: {},
      config: {} as any,
    });
    axiosPostSpy.mockRejectedValue(refresh401Error);

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('Unauthorized', '401', config, null, {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config,
      });
    };

    await expect(Promise.all([
      apiClient.get('/profile'),
      apiClient.get('/notifications'),
    ])).rejects.toThrow();

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('4. should NOT logout if refresh endpoint returns 500 server error', async () => {
    const refresh500Error = new AxiosError('Internal Server Error', '500', undefined, null, {
      status: 500,
      statusText: 'Internal Server Error',
      data: { message: 'Database connection failed' },
      headers: {},
      config: {} as any,
    });
    axiosPostSpy.mockRejectedValue(refresh500Error);

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('Unauthorized', '401', config, null, {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config,
      });
    };

    await expect(apiClient.get('/dashboard')).rejects.toThrow();

    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('5. should NOT attempt refresh and NOT logout on POST /auth/login 401', async () => {
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('Bad credentials', '401', config, null, {
        status: 401,
        statusText: 'Unauthorized',
        data: { message: 'Invalid email or password' },
        headers: {},
        config,
      });
    };

    await expect(apiClient.post('/auth/login', { email: 'a@b.com', password: 'wrong' })).rejects.toThrow();

    expect(axiosPostSpy).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('6. should not enter an infinite loop if retried request fails with 401 again', async () => {
    axiosPostSpy.mockResolvedValue({
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });

    let calls = 0;
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      calls++;
      throw new AxiosError('Unauthorized', '401', config, null, {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config,
      });
    };

    await expect(apiClient.get('/sensitive-resource')).rejects.toThrow();

    // 1st call = original, 2nd call = retried, no 3rd call
    expect(calls).toBe(2);
  });

  it('7. should NOT leak rejected refreshPromise when no refresh token exists, allowing subsequent 401 to refresh successfully', async () => {
    // Stage 1: No refresh token stored
    delete (secureStoreState as any).refreshToken;

    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError('Unauthorized', '401', config, null, {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config,
      });
    };

    // First 401 request with no refresh token -> should fail and trigger logout once
    await expect(apiClient.get('/user/data')).rejects.toThrow();
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(axiosPostSpy).not.toHaveBeenCalled();

    // Stage 2: User logs in or stores a new valid refresh token
    secureStoreState.refreshToken = 'new-valid-refresh-token';
    axiosPostSpy.mockResolvedValueOnce({
      data: {
        accessToken: 'brand-new-access-token',
        refreshToken: 'brand-new-refresh-token',
      },
    });

    let secondAttemptCount = 0;
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      secondAttemptCount++;
      if (secondAttemptCount === 1) {
        throw new AxiosError('Unauthorized', '401', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config,
        });
      }
      return {
        data: { success: true, token: config.headers?.Authorization },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    // Second 401 request -> must initiate a REAL refresh call, NOT return a stuck rejected promise
    const result = await apiClient.get('/user/data-after-login');
    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    expect(result.data.success).toBe(true);
    expect(result.data.token).toBe('Bearer brand-new-access-token');
  });

  it('8. should initiate a fresh refresh call on subsequent 401 after a previous refresh network failure', async () => {
    // 1st cycle: Refresh fails with network error
    axiosPostSpy.mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'));

    let attempt1 = 0;
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      attempt1++;
      throw new AxiosError('Unauthorized', '401', config, null, {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config,
      });
    };

    await expect(apiClient.get('/feed')).rejects.toThrow();
    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    expect(mockLogout).not.toHaveBeenCalled();

    // 2nd cycle: Network recovers, subsequent 401 must initiate a fresh refresh call
    axiosPostSpy.mockResolvedValueOnce({
      data: {
        accessToken: 'recovered-access-token',
        refreshToken: 'recovered-refresh-token',
      },
    });

    let attempt2 = 0;
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      attempt2++;
      if (attempt2 === 1) {
        throw new AxiosError('Unauthorized', '401', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config,
        });
      }
      return {
        data: { ok: true, token: config.headers?.Authorization },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const res = await apiClient.get('/feed');
    expect(axiosPostSpy).toHaveBeenCalledTimes(2);
    expect(res.data.ok).toBe(true);
    expect(res.data.token).toBe('Bearer recovered-access-token');
  });
});
