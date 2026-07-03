"use client";

import { BottomBar } from "@/components/BottomBar";
import { AppIcon } from "@/components/Icons/AppIcon";
import { DashboardSquareIcon } from "@/components/Icons/DashboardSquareIcon";
import { IncognitoIcon } from "@/components/Icons/IncognitoIcon";
import { SecurityIcon } from "@/components/Icons/SecurityIcon";
import { TransactionIcon } from "@/components/Icons/TransactionIcon";
import { UserAccountIcon } from "@/components/Icons/UserAccountIcon";
import { WalletIcon } from "@/components/Icons/WalletIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { ReactNode } from "react";
import { SectionSubTabs } from "../common/SectionSubTabs";

type AppIdChromeProps = {
  params: { teamId?: string; appId?: string };
  isOnChainApp: boolean;
  showWorldId40Nav: boolean;
  hasRpRegistration: boolean;
  hasLegacyActions: boolean;
  children: ReactNode;
};

export const AppIdChrome = ({
  params,
  isOnChainApp,
  showWorldId40Nav,
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
  const miniAppDevelopPath = urls.miniAppDevelop({
    team_id: teamId,
    app_id: appId,
  });
  const isMiniAppPermissions = pathname === miniAppPermissionsPath;
  const isMiniAppTransactions = pathname === miniAppTransactionsPath;
  const isMiniAppNotifications = pathname === miniAppNotificationsPath;
  const isMiniAppDevelop = pathname === miniAppDevelopPath;

  if (showWorldId40Nav) {
    return (
      <div className="flex min-h-dvh flex-col">
        {isWorldIdSegment && (
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
                    href: urls.actions({
                      team_id: teamId,
                      app_id: appId,
                    }),
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
                    label: "Develop",
                    href: miniAppDevelopPath,
                    segment: "mini-app",
                    active: isMiniAppDevelop,
                  },
                  {
                    label: "Permissions",
                    href: miniAppPermissionsPath,
                    segment: "mini-app",
                    active: isMiniAppPermissions,
                  },
                  {
                    label: "Transactions",
                    href: miniAppTransactionsPath,
                    segment: "mini-app",
                    active: isMiniAppTransactions,
                  },
                  {
                    label: "Notifications",
                    href: miniAppNotificationsPath,
                    segment: "mini-app",
                    active: isMiniAppNotifications,
                  },
                ]}
              />
            </SizingWrapper>
          </div>
        )}

        {children}

        <BottomBar className="order-last mt-auto">
          <BottomBar.Link
            href={`/teams/${teamId}/apps/${appId}`}
            segment={null}
          >
            <DashboardSquareIcon className="size-7" />
          </BottomBar.Link>

          <BottomBar.Link
            href={
              hasRpRegistration
                ? urls.worldId40({ team_id: teamId, app_id: appId })
                : hasLegacyActions
                  ? urls.actions({ team_id: teamId, app_id: appId })
                  : urls.enableWorldId4({ team_id: teamId, app_id: appId })
            }
            segment={"world-id-4-0"}
            active={isWorldIdSegment}
          >
            <AppIcon className="size-7" />
          </BottomBar.Link>

          <BottomBar.Link
            href={`/teams/${teamId}/apps/${appId}/configuration`}
            segment={"configuration"}
          >
            <SecurityIcon className="size-7" />
          </BottomBar.Link>

          <BottomBar.Link href={miniAppPermissionsPath} segment={"mini-app"}>
            <WalletIcon className="size-7" />
          </BottomBar.Link>
        </BottomBar>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {children}

      <BottomBar className="order-last mt-auto">
        <BottomBar.Link href={`/teams/${teamId}/apps/${appId}`} segment={null}>
          <DashboardSquareIcon className="size-7" />
        </BottomBar.Link>

        <BottomBar.Link
          href={urls.worldIdActions({ team_id: teamId, app_id: appId })}
          segment={"world-id-actions"}
        >
          <IncognitoIcon className="size-7" />
        </BottomBar.Link>

        <BottomBar.Link
          href={`/teams/${teamId}/apps/${appId}/sign-in-with-world-id`}
          segment={"sign-in-with-world-id"}
        >
          <UserAccountIcon className="size-7" />
        </BottomBar.Link>

        <BottomBar.Link
          href={`/teams/${teamId}/apps/${appId}/configuration`}
          segment={"configuration"}
        >
          <SecurityIcon className="size-7" />
        </BottomBar.Link>
        <BottomBar.Link href={miniAppTransactionsPath} segment={"mini-app"}>
          <TransactionIcon className="size-7" />
        </BottomBar.Link>
      </BottomBar>
    </div>
  );
};
