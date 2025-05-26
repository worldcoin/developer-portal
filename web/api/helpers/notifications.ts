import { AppStoreMetadataFields } from "@/lib/types";

// logic responsible for setting this is in api/evaluate-app-notification-permissions
export const getNotificationPermissions = (
  appMetadata: Pick<
    AppStoreMetadataFields,
    | "is_allowed_unlimited_notifications"
    | "max_notifications_per_day"
    | "notification_state"
    | "notification_state_changed_date"
  >,
): {
  is_allowed_unlimited_notifications: boolean | null | undefined;
  max_notifications_per_day: number | null | undefined;
} => {
  if (appMetadata.notification_state === "normal") {
    return {
      is_allowed_unlimited_notifications:
        appMetadata.is_allowed_unlimited_notifications,
      max_notifications_per_day: appMetadata.max_notifications_per_day,
    };
  }
  if (appMetadata.notification_state === "paused") {
    return {
      is_allowed_unlimited_notifications: false,
      max_notifications_per_day: 0,
    };
  }
  if (appMetadata.notification_state === "enabled_after_pause") {
    return {
      is_allowed_unlimited_notifications:
        appMetadata.is_allowed_unlimited_notifications,
      max_notifications_per_day: appMetadata.max_notifications_per_day,
    };
  }

  // default
  return {
    is_allowed_unlimited_notifications:
      appMetadata.is_allowed_unlimited_notifications,
    max_notifications_per_day: appMetadata.max_notifications_per_day,
  };
};
