import nextJest from "next/jest";
import type { Config } from "jest";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig: Config = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ["node_modules", "<rootDir>"],
  testEnvironment: "node",
  setupFiles: ["./jest.setup.ts"],
  globalSetup: "./tests/setupEnv.js",
  automock: false,
  resetMocks: false,
  moduleNameMapper: {
    "^@worldcoin/idkit$":
      "<rootDir>/node_modules/@worldcoin/idkit/build/idkit-js.js",
  },
  preset: "ts-jest",
};

const config = createJestConfig(customJestConfig);

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = config;
export default config;
