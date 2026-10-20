jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock.default ?? mock;
});

globalThis.__workletsModuleProxy = new Proxy({}, {
  get: () => () => ({}),
});

require('react-native-worklets/src/mock');

jest.mock('react-native-reanimated', () => {
  const reanimated = require('react-native-reanimated/mock');
  return {
    ...reanimated,
    configureReanimatedLogger: jest.fn(),
    ReanimatedLogLevel: {
      log: 0,
      warn: 1,
      error: 2,
    },
  };
});

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = (props) => React.createElement(View, props);
  const MockMarker = (props) => React.createElement(View, props);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
  AppleAuthenticationButtonType: {
    SIGN_IN: 0,
    CONTINUE: 1,
    SIGN_UP: 2,
  },
  AppleAuthenticationButtonStyle: {
    WHITE: 0,
    WHITE_OUTLINE: 1,
    BLACK: 2,
  },
  AppleAuthenticationButton: 'AppleAuthenticationButton',
}));

jest.mock('expo-crypto', () => {
  const nodeCrypto = require('crypto');
  return {
    randomUUID: jest.fn(() => 'c2b3e8a4-5678-4abc-9def-0123456789ab'),
    digestStringAsync: jest.fn(async (algorithm, str) => {
      return nodeCrypto.createHash('sha256').update(str).digest('hex');
    }),
    CryptoDigestAlgorithm: {
      SHA256: 'SHA-256',
    },
    CryptoDigestEncoding: {
      HEX: 'hex',
      BASE64: 'base64',
    },
  };
});




