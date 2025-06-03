"use client";
import { useGetIsAppNotificationsDisabledQuery } from "../graphql/client/get-is-app-notifications-disabled.generated";
import { NotificationStatus } from "./notification-status";

export const NotificationStatusSection = ({ appId }: { appId: string }) => {
  const { data } = useGetIsAppNotificationsDisabledQuery({
    variables: {
      app_id: appId,
    },
  });

  const isNotificationPaused = true;

  return isNotificationPaused && <NotificationStatus />;
};
