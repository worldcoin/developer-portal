"use client";
import { useGetIsAppNotificationsDisabledQuery } from "../graphql/client/get-is-app-notifications-disabled.generated";
import { NotificationStatus } from "./notification-status";

export const NotificationStatusSection = ({ appId }: { appId: string }) => {
  const { data } = useGetIsAppNotificationsDisabledQuery({
    variables: {
      app_id: appId,
    },
  });

  const areNotificationsPaused = !!data?.app?.[0]?.id;
  if (areNotificationsPaused) {
    return <NotificationStatus />;
  }

  return null;
};
