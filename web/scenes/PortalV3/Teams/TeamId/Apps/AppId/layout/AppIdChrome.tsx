"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { SectionSubTabs } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/common/SectionSubTabs";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { ReactNode } from "react";

type AppIdChromeProps = {
  params: { teamId?: string; appId?: string };
  hasRpRegistration: boolean;
  hasLegacyActions: boolean;
  children: ReactNode;
};

/**
 * v3 app chrome. The primary app nav (Dashboard / World ID / Configuration /
 * Mini App) lives in the sidebar shell, so this renders only the per-section
 * sub-tabs (World ID, Mini App) above the page content — no top tabs, no mobile
 * bottom bar. Configuration has no sub-tabs in v3 (Danger zone moved into the
 * Configuration page).
 */
export const AppIdChrome = ({
  params,
  hasRpRegistration,
  hasLegacyActions,
  children,
}: AppIdChromeProps) => {
  const pathname = usePathname();
  const segment = useSelectedLayoutSegment();

  const { teamId, appId } = params;
  if (!teamId || !appId) {
    return <>{children}</>;
  }

  const isWorldIdSegment =
    segment === "world-id-4-0" ||
    segment === "world-id-actions" ||
    segment === "actions";
  const isMiniAppSegment =
    segment === "mini-app" ||
    segment === "transactions" ||
    segment === "notifications";

  const miniAppPermissionsPath = urls.miniAppPermissions({
    team_id: teamId,
    app_id: appId,
  });
  const miniAppTransactionsPath = urls.miniAppTransactions({
    team_id: teamId,
    app_id: appId,
  });
  const miniAppNotificationsPath = urls.miniAppNotifications({
    team_id: teamId,
    app_id: appId,
  });

  return (
    <>
      {isWorldIdSegment && (hasRpRegistration || hasLegacyActions) && (
        <div className="md:border-b md:border-grey-100 md:bg-grey-50">
          <SizingWrapper variant="nav">
            <SectionSubTabs
              items={[
                {
                  label: "World ID 4.0",
                  href: `/teams/${teamId}/apps/${appId}/world-id-4-0`,
                  segment: "world-id-4-0",
                  hidden: !hasRpRegistration,
                },
                {
                  label: "Actions",
                  href: `/teams/${teamId}/apps/${appId}/world-id-actions`,
                  segment: "world-id-actions",
                  hidden: !hasRpRegistration,
                },
                {
                  label: "World ID 3.0 Legacy",
                  href: urls.actions({ team_id: teamId, app_id: appId }),
                  segment: "actions",
                  hidden: !hasLegacyActions,
                },
              ]}
            />
          </SizingWrapper>
        </div>
      )}

      {isMiniAppSegment && (
        <div className="md:border-b md:border-grey-100 md:bg-grey-50">
          <SizingWrapper gridClassName="hidden md:grid" variant="nav">
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
              ]}
            />
          </SizingWrapper>
        </div>
      )}

      {children}
    </>
  );
};
