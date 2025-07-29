import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config({ path: '.env'});
dotenv.config({ path: '.env.development'});

console.log('Test environment setup complete');

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/specs/**/*.spec.ts'],
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../web/$1'
  },
  verbose: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
}; 
