import { AppStatsItem } from "@/lib/types";
import { subDays, subMinutes } from "date-fns";
import {
  evaluateNotificationPermissions,
  InternalNotificationPermissionShouldUpdateResult,
} from ".";

jest.mock("@/api/helpers/utils", () => ({
  protectInternalEndpoint: jest.fn(() => ({
    isAuthenticated: true,
    errorResponse: null,
  })),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/lib/utils", () => ({
  fetchWithRetry: jest.fn(),
}));

jest.mock("../helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));

const ONE_WEEK_IN_DAYS = 7;
const ONE_WEEK_IN_MINUTES = ONE_WEEK_IN_DAYS * 24 * 60;
const TIMING_LEEWAY_MINUTES = 5;

describe("_evaluate-app-notification-permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createAppStats = (
    openRateData?: { date: string; value: number }[],
  ): AppStatsItem => ({
    app_id: "test-app",
    unique_users: 100,
    last_updated_at: new Date().toISOString(),
    unique_users_last_7_days: 50,
    total_impressions: 1000,
    new_users_last_7_days: 25,
    open_rate_last_14_days: openRateData || [],
  });

  describe("evaluateNotificationPermissions", () => {
    it("should skip evaluation for apps with unlimited notifications", () => {
      const appMetadata = {
        app_id: "test-app",
        notification_permission_status: "normal",
        notification_permission_status_changed_date: null,
        is_allowed_unlimited_notifications: true,
      };

      const appStats = createAppStats([
        { date: subDays(new Date(), 3).toISOString(), value: 0.05 }, // low open rate
      ]);

      const result = evaluateNotificationPermissions(appMetadata, appStats);
      expect(result.should_update_state).toBe(false);
    });

    describe("normal state transitions", () => {
      it("should pause notifications when open rate is below threshold", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "normal",
          notification_permission_status_changed_date: null,
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats([
          { date: subDays(new Date(), 3).toISOString(), value: 0.05 }, // 5% open rate (below 10% threshold)
          { date: subDays(new Date(), 2).toISOString(), value: 0.08 },
        ]);

        const result = evaluateNotificationPermissions(
          appMetadata,
          appStats,
        ) as InternalNotificationPermissionShouldUpdateResult;

        expect(result.should_update_state).toBe(true);
        expect(result.new_state).toBe("paused");
        expect(result.new_state_changed_date).toBeInstanceOf(Date);
      });

      it("should continue normal operation when open rate is above threshold", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "normal",
          notification_permission_status_changed_date: null,
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats([
          { date: subDays(new Date(), 3).toISOString(), value: 0.15 },
          { date: subDays(new Date(), 2).toISOString(), value: 0.12 },
        ]);

        const result = evaluateNotificationPermissions(appMetadata, appStats);
        expect(result.should_update_state).toBe(false);
      });

      it("should continue normal operation when open rate is exactly 0", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "normal",
          notification_permission_status_changed_date: null,
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats([
          { date: subDays(new Date(), 3).toISOString(), value: 0.0 },
        ]);

        const result = evaluateNotificationPermissions(appMetadata, appStats);
        expect(result.should_update_state).toBe(false);
      });

      it("should continue normal operation when open rate is exactly at threshold", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "normal",
          notification_permission_status_changed_date: null,
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats([
          { date: subDays(new Date(), 3).toISOString(), value: 0.1 }, // exactly 10% threshold
        ]);

        const result = evaluateNotificationPermissions(appMetadata, appStats);
        expect(result.should_update_state).toBe(false);
      });
    });

    describe("paused state transitions", () => {
      it("should stay paused when less than one week has passed", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "paused",
          notification_permission_status_changed_date: subDays(
            new Date(),
            3,
          ).toISOString(), // 3 days ago
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats([
          { date: subDays(new Date(), 3).toISOString(), value: 0.15 }, // good open rate
        ]);

        const result = evaluateNotificationPermissions(appMetadata, appStats);
        expect(result.should_update_state).toBe(false);
      });

      it("should move to enabled_after_pause when one week has passed", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "paused",
          notification_permission_status_changed_date: subDays(
            new Date(),
            7,
          ).toISOString(), // exactly 7 days ago
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats([
          { date: subDays(new Date(), 3).toISOString(), value: 0.05 }, // doesn't matter for this transition
        ]);

        const result = evaluateNotificationPermissions(
          appMetadata,
          appStats,
        ) as InternalNotificationPermissionShouldUpdateResult;

        expect(result.should_update_state).toBe(true);
        expect(result.new_state).toBe("enabled_after_pause");
        expect(result.new_state_changed_date).toBeInstanceOf(Date);
      });

      it("should move to enabled_after_pause with timing leeway", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "paused",
          notification_permission_status_changed_date: subMinutes(
            new Date(),
            ONE_WEEK_IN_MINUTES - TIMING_LEEWAY_MINUTES,
          ).toISOString(), // exactly at leeway threshold
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats();

        const result = evaluateNotificationPermissions(
          appMetadata,
          appStats,
        ) as InternalNotificationPermissionShouldUpdateResult;

        expect(result.should_update_state).toBe(true);
        expect(result.new_state).toBe("enabled_after_pause");
      });
    });

    describe("enabled_after_pause state transitions", () => {
      it("should stay in enabled_after_pause when less than one week has passed", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "enabled_after_pause",
          notification_permission_status_changed_date: subDays(
            new Date(),
            3,
          ).toISOString(), // 3 days ago
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats([
          { date: subDays(new Date(), 3).toISOString(), value: 0.05 }, // low open rate
        ]);

        const result = evaluateNotificationPermissions(appMetadata, appStats);
        expect(result.should_update_state).toBe(false);
      });

      it("should move to paused when open rate is still below threshold after one week", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "enabled_after_pause",
          notification_permission_status_changed_date: subMinutes(
            new Date(),
            ONE_WEEK_IN_MINUTES,
          ).toISOString(), // exactly 7 days ago
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats([
          { date: subDays(new Date(), 3).toISOString(), value: 0.05 }, // 5% open rate (below threshold)
          { date: subDays(new Date(), 2).toISOString(), value: 0.08 },
        ]);

        const result = evaluateNotificationPermissions(
          appMetadata,
          appStats,
        ) as InternalNotificationPermissionShouldUpdateResult;

        expect(result.should_update_state).toBe(true);
        expect(result.new_state).toBe("paused");
        expect(result.new_state_changed_date).toBeInstanceOf(Date);
      });

      it("should move to normal when open rate is above threshold after one week", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "enabled_after_pause",
          notification_permission_status_changed_date: subMinutes(
            new Date(),
            ONE_WEEK_IN_MINUTES,
          ).toISOString(), // exactly 7 days ago
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats([
          { date: subDays(new Date(), 3).toISOString(), value: 0.15 }, // 15% open rate (above threshold)
          { date: subDays(new Date(), 2).toISOString(), value: 0.12 },
        ]);

        const result = evaluateNotificationPermissions(
          appMetadata,
          appStats,
        ) as InternalNotificationPermissionShouldUpdateResult;

        expect(result.should_update_state).toBe(true);
        expect(result.new_state).toBe("normal");
        expect(result.new_state_changed_date).toBeInstanceOf(Date);
      });
    });

    describe("edge cases", () => {
      it("should handle null state changed date (defaults to infinite time passed)", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "paused",
          notification_permission_status_changed_date: null,
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats();

        const result = evaluateNotificationPermissions(
          appMetadata,
          appStats,
        ) as InternalNotificationPermissionShouldUpdateResult;

        expect(result.should_update_state).toBe(true);
        expect(result.new_state).toBe("enabled_after_pause");
      });

      it("should handle apps with no open rate data", () => {
        const appMetadata = {
          app_id: "test-app",
          notification_permission_status: "normal",
          notification_permission_status_changed_date: null,
          is_allowed_unlimited_notifications: false,
        };

        const appStats = createAppStats(); // no open rate data

        const result = evaluateNotificationPermissions(appMetadata, appStats);
        expect(result.should_update_state).toBe(false);
      });
    });

    describe("timing precision tests", () => {
      it("should respect timing leeway for state transitions", () => {
        const appMetadataAfterLeeway = {
          app_id: "test-app",
          notification_permission_status: "paused",
          notification_permission_status_changed_date: subMinutes(
            new Date(),
            ONE_WEEK_IN_MINUTES + TIMING_LEEWAY_MINUTES + 2,
          ).toISOString(), // 7 minutes past one week
          is_allowed_unlimited_notifications: false,
        };

        const appStatsAfterLeeway = createAppStats();

        const resultAfterLeeway = evaluateNotificationPermissions(
          appMetadataAfterLeeway,
          appStatsAfterLeeway,
        );
        expect(resultAfterLeeway.should_update_state).toBe(true);

        // within leeway window check
        const appMetadataWithinLeeway = {
          app_id: "test-app",
          notification_permission_status: "paused",
          notification_permission_status_changed_date: subMinutes(
            new Date(),
            ONE_WEEK_IN_MINUTES - TIMING_LEEWAY_MINUTES - 2,
          ).toISOString(), // 8 minutes before one week (outside leeway - should not update)
          is_allowed_unlimited_notifications: false,
        };

        const appStatsWithinLeeway = createAppStats();

        const resultWithinLeeway = evaluateNotificationPermissions(
          appMetadataWithinLeeway,
          appStatsWithinLeeway,
        );
        expect(resultWithinLeeway.should_update_state).toBe(false);
      });
    });
  });

  describe("complete logic flow", () => {
    it("should handle complete normal to paused to normal cycle", () => {
      const baseAppMetadata = {
        app_id: "test-app",
        is_allowed_unlimited_notifications: false,
      };

      const appStats = createAppStats([
        { date: subDays(new Date(), 3).toISOString(), value: 0.05 }, // low open rate
      ]);

      // step 1: normal -> paused due to low open rate
      let result = evaluateNotificationPermissions(
        {
          ...baseAppMetadata,
          notification_permission_status: "normal",
          notification_permission_status_changed_date: null,
        },
        appStats,
      ) as InternalNotificationPermissionShouldUpdateResult;

      expect(result.should_update_state).toBe(true);
      expect(result.new_state).toBe("paused");

      // step 2: paused -> enabled_after_pause after 1 week
      const pausedDate = subMinutes(new Date(), ONE_WEEK_IN_MINUTES);
      result = evaluateNotificationPermissions(
        {
          ...baseAppMetadata,
          notification_permission_status: "paused",
          notification_permission_status_changed_date: pausedDate.toISOString(),
        },
        appStats,
      ) as InternalNotificationPermissionShouldUpdateResult;

      expect(result.should_update_state).toBe(true);
      expect(result.new_state).toBe("enabled_after_pause");

      // step 3: enabled_after_pause -> paused again due to continued low open rate
      const enabledDate = subMinutes(new Date(), ONE_WEEK_IN_MINUTES);
      result = evaluateNotificationPermissions(
        {
          ...baseAppMetadata,
          notification_permission_status: "enabled_after_pause",
          notification_permission_status_changed_date:
            enabledDate.toISOString(),
        },
        appStats,
      ) as InternalNotificationPermissionShouldUpdateResult;

      expect(result.should_update_state).toBe(true);
      expect(result.new_state).toBe("paused");
    });

    it("should handle recovery scenario: paused to enabled to normal", () => {
      const baseAppMetadata = {
        app_id: "test-app",
        is_allowed_unlimited_notifications: false,
      };

      const goodOpenRateStats = createAppStats([
        { date: subDays(new Date(), 3).toISOString(), value: 0.15 }, // good open rate
        { date: subDays(new Date(), 2).toISOString(), value: 0.12 },
      ]);

      // step 1: paused -> enabled_after_pause after 1 week
      const pausedDate = subMinutes(new Date(), ONE_WEEK_IN_MINUTES);
      let result = evaluateNotificationPermissions(
        {
          ...baseAppMetadata,
          notification_permission_status: "paused",
          notification_permission_status_changed_date: pausedDate.toISOString(),
        },
        goodOpenRateStats,
      ) as InternalNotificationPermissionShouldUpdateResult;

      expect(result.should_update_state).toBe(true);
      expect(result.new_state).toBe("enabled_after_pause");

      // step 2: enabled_after_pause -> normal due to good open rate
      const enabledDate = subMinutes(new Date(), ONE_WEEK_IN_MINUTES);
      result = evaluateNotificationPermissions(
        {
          ...baseAppMetadata,
          notification_permission_status: "enabled_after_pause",
          notification_permission_status_changed_date:
            enabledDate.toISOString(),
        },
        goodOpenRateStats,
      ) as InternalNotificationPermissionShouldUpdateResult;

      expect(result.should_update_state).toBe(true);
      expect(result.new_state).toBe("normal");
    });
  });
});
