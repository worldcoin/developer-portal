import dotenv from "dotenv";
import type { Config } from "jest";

// Load environment variables for tests
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.development" });

console.log("Test environment setup complete");

const config: Config = {
  preset: "ts-jest",
  transform: {
    "^.+\\.(js|ts)$": "babel-jest",
  },
  transformIgnorePatterns: ["node_modules/auth0/(?!(nextjs-auth0)/)"],
  testMatch: ["<rootDir>/specs/**/*.spec.ts"],
  testTimeout: 30000,
  moduleDirectories: ["node_modules", "<rootDir>/../../web"],
  verbose: true,
};

export default config;
