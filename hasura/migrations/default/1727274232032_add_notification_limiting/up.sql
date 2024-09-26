ALTER TABLE app_metadata
  ADD COLUMN "isAllowedUnlimitedNotifications" BOOLEAN DEFAULT FALSE,
  ADD COLUMN "maxNotificationsPerDay" INT DEFAULT 0;