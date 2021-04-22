module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: false,
  collectCoverage: false,
  globals: {
    'ts-jest': {
      // reference: https://kulshekhar.github.io/ts-jest/user/config
    },
  },
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1',
  },
  setupFiles: ['./jest.setup.ts'],
};
