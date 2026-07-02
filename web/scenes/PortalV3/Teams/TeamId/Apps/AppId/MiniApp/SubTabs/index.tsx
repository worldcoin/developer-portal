"use client";

import { urls } from "@/lib/urls";
import { useParams, usePathname } from "next/navigation";
import { SectionSubTabs } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/common/SectionSubTabs";

export const MiniAppSubTabs = () => {
  const params = useParams<{ teamId: string; appId: string }>();
  const pathname = usePathname();

  const miniAppPermissionsPath = urls.miniAppPermissions({
    team_id: params?.teamId ?? "",
    app_id: params?.appId ?? "",
  });
  const miniAppTransactionsPath = urls.miniAppTransactions({
    team_id: params?.teamId ?? "",
    app_id: params?.appId ?? "",
  });
  const miniAppNotificationsPath = urls.miniAppNotifications({
    team_id: params?.teamId ?? "",
    app_id: params?.appId ?? "",
  });
  const miniAppDevelopPath = urls.miniAppDevelop({
    team_id: params?.teamId ?? "",
    app_id: params?.appId ?? "",
  });

  return (
    <SectionSubTabs
      items={[
        {
          label: "Permissions",
          href: miniAppPermissionsPath,
          segment: "mini-app",
          active: pathname === miniAppPermissionsPath,
        },
        {
          label: "Transactions",
          href: miniAppTransactionsPath,
          segment: "mini-app",
          active: pathname === miniAppTransactionsPath,
        },
        {
          label: "Notifications",
          href: miniAppNotificationsPath,
          segment: "mini-app",
          active: pathname === miniAppNotificationsPath,
        },
        {
          label: "X",
          href: miniAppDevelopPath,
          segment: "mini-app",
          active: pathname === miniAppDevelopPath,
        },
      ]}
    />
  );
};
