"use client";

import { BottomBar } from "@/components/BottomBar";
import { AppIcon } from "@/components/Icons/AppIcon";
import { DashboardSquareIcon } from "@/components/Icons/DashboardSquareIcon";
import { IncognitoIcon } from "@/components/Icons/IncognitoIcon";
import { SecurityIcon } from "@/components/Icons/SecurityIcon";
import { TransactionIcon } from "@/components/Icons/TransactionIcon";
import { WalletIcon } from "@/components/Icons/WalletIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { ReactNode } from "react";
import { SectionSubTabs } from "../common/SectionSubTabs";

function isOnboardingPath(
  pathname: string | null,
  params: { teamId?: string; appId?: string },
): boolean {
  if (!pathname || !params.teamId || !params.appId) return false;
  const enablePath = urls
    .enableWorldId40({ team_id: params.teamId, app_id: params.appId })
    .split("?")[0];
  const configurePath = urls
    .configureSignerKey({ team_id: params.teamId, app_id: params.appId })
    .split("?")[0];
  const selfManagedPath = urls
    .selfManagedRegistration({ team_id: params.teamId, app_id: params.appId })
    .split("?")[0];
  return (
    pathname === enablePath ||
    pathname === configurePath ||
    pathname === selfManagedPath
  );
}

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

  if (isOnboardingPath(pathname, params)) {
    return <>{children}</>;
  }

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
  const isMiniAppPermissions = pathname === miniAppPermissionsPath;
  const isMiniAppTransactions = pathname === miniAppTransactionsPath;
  const isMiniAppNotifications = pathname === miniAppNotificationsPath;

  if (showWorldId40Nav) {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="md:border-b md:border-grey-100">
          <SizingWrapper gridClassName="hidden md:grid" variant="nav">
            <Tabs className="m-auto font-gta">
              <Tab
                href={`/teams/${teamId}/apps/${appId}`}
                underlined
                segment={null}
              >
                <Typography variant={TYPOGRAPHY.R4}>Dashboard</Typography>
              </Tab>

              <Tab
                href={
                  hasRpRegistration
                    ? `/teams/${teamId}/apps/${appId}/world-id-4-0`
                    : hasLegacyActions
                      ? `/teams/${teamId}/apps/${appId}/actions`
                      : urls.enableWorldId40({
                          team_id: teamId,
                          app_id: appId,
                          next: "actions",
                        })
                }
                underlined
                active={isWorldIdSegment}
                segment={"world-id-4-0"}
              >
                <Typography variant={TYPOGRAPHY.R4}>World ID</Typography>
              </Tab>

              <Tab
                href={`/teams/${teamId}/apps/${appId}/configuration`}
                underlined
                segment={"configuration"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Configuration</Typography>
              </Tab>

              <Tab
                href={miniAppPermissionsPath}
                underlined
                active={isMiniAppSegment}
                segment={"mini-app"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Mini App</Typography>
              </Tab>
            </Tabs>
          </SizingWrapper>
        </div>

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
                  },
                  {
                    label: "World ID 3.0 Legacy",
                    href: `/teams/${teamId}/apps/${appId}/actions`,
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
                ? `/teams/${teamId}/apps/${appId}/world-id-4-0`
                : hasLegacyActions
                  ? `/teams/${teamId}/apps/${appId}/actions`
                  : urls.enableWorldId40({
                      team_id: teamId,
                      app_id: appId,
                      next: "actions",
                    })
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
      <div className="md:border-b md:border-grey-100">
        <SizingWrapper gridClassName="hidden md:grid" variant="nav">
          <Tabs className="m-auto font-gta">
            <Tab
              href={`/teams/${teamId}/apps/${appId}`}
              underlined
              segment={null}
            >
              <Typography variant={TYPOGRAPHY.R4}>Dashboard</Typography>
            </Tab>

            <Tab
              href={`/teams/${teamId}/apps/${appId}/configuration`}
              underlined
              segment={"configuration"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Configuration</Typography>
            </Tab>

            <Tab
              href={`/teams/${teamId}/apps/${appId}/actions`}
              underlined
              segment={"actions"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Incognito actions</Typography>
            </Tab>

            <Tab
              href={miniAppTransactionsPath}
              underlined
              segment={"mini-app"}
              active={isMiniAppTransactions}
            >
              <Typography variant={TYPOGRAPHY.R4}>Transactions</Typography>
            </Tab>
            <Tab
              href={miniAppNotificationsPath}
              underlined
              segment={"mini-app"}
              active={isMiniAppNotifications}
            >
              <Typography variant={TYPOGRAPHY.R4}>Notifications</Typography>
            </Tab>

            <Tab
              href={`/teams/${teamId}/api-keys`}
              underlined
              segment={"API Keys"}
            >
              <Typography variant={TYPOGRAPHY.R4}>API Keys</Typography>
            </Tab>
          </Tabs>
        </SizingWrapper>
      </div>

      {children}

      <BottomBar className="order-last mt-auto">
        <BottomBar.Link href={`/teams/${teamId}/apps/${appId}`} segment={null}>
          <DashboardSquareIcon className="size-7" />
        </BottomBar.Link>

        <BottomBar.Link
          href={`/teams/${teamId}/apps/${appId}/actions`}
          segment={"actions"}
        >
          <IncognitoIcon className="size-7" />
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
