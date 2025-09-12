import dotenv from "dotenv";
import type { Config } from "jest";

// Load environment variables for tests
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.development" });

const config: Config = {
  preset: "ts-jest",
  setupFilesAfterEnv: ["jest-expect-message", "<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/specs/**/*.spec.ts"],
  testTimeout: 30000,
  moduleDirectories: ["node_modules", "<rootDir>", "<rootDir>/../../web"],
  modulePaths: ["./"],
  verbose: true,
};

export default config;
