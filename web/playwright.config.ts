import { type PlaywrightTestConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, ".env.test") });

const config: PlaywrightTestConfig = {
  timeout: 60000,
  globalSetup: require.resolve("./tests/e2e/global-setup"),
  globalTeardown: require.resolve("./tests/e2e/global-teardown"),
  workers: 1,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    browserName: "chromium",
    screenshot: "off",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  expect: {
    timeout: 30000,
  },
  projects: [
    {
      name: "dev-portal-stage",
      testDir: "tests/e2e/specs",
      testMatch: ["tests/e2e/specs/**/*.spec.ts"],
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: {
    command: "pnpm dev",
    port: 3000,
    timeout: 60 * 1000,
    reuseExistingServer: true,
  },
};

export default config;
