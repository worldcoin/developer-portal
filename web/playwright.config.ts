import { type PlaywrightTestConfig } from "@playwright/test";
import "dotenv/config";

const config: PlaywrightTestConfig = {
  timeout: 60000,
  globalSetup: require.resolve('./tests/e2e/global-setup'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown'),
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
};

export default config;
