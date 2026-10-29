/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/**/*.{spec,test}.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/', '<rootDir>/dist/', '<rootDir>/src/_parked/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
