module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo/virtual/env$': '<rootDir>/test-mocks/expoVirtualEnv.js',
  },
};
