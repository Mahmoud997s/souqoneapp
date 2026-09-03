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




