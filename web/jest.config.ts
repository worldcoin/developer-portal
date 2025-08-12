import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

const customJestConfig: Config = {
  moduleDirectories: ["node_modules", "<rootDir>"],
  testEnvironment: "node",
  setupFiles: ["./jest.setup.ts"],
  automock: false,
  resetMocks: false,
  preset: "ts-jest",
  moduleNameMapper: {
    "^@/api/(.*)$": "<rootDir>/api/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
  },
  transformIgnorePatterns: ["node_modules/(?!(serialize-error)/)"],
};

const config = createJestConfig(customJestConfig);

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = config;
export default config;
