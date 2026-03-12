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
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import {
  usePathname,
  useSearchParams,
  useSelectedLayoutSegment,
} from "next/navigation";
import { ReactNode } from "react";
import { appendVersionParam, getMiniAppNavState } from "../versioning";
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
  hasDraftVersion: boolean;
  hasVerifiedVersion: boolean;
  hasDraftMiniApp: boolean;
  hasVerifiedMiniApp: boolean;
  children: ReactNode;
};

export const AppIdChrome = ({
  params,
  isOnChainApp,
  showWorldId40Nav,
  hasRpRegistration,
  hasLegacyActions,
  hasDraftVersion,
  hasVerifiedVersion,
  hasDraftMiniApp,
  hasVerifiedMiniApp,
  children,
}: AppIdChromeProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segment = useSelectedLayoutSegment();

  if (isOnboardingPath(pathname, params)) {
    return <>{children}</>;
  }

  const { teamId, appId } = params;
  if (!teamId || !appId) {
    return <>{children}</>;
  }

  const miniAppNav = getMiniAppNavState({
    teamId,
    appId,
    pathname,
    searchParams,
    hasDraft: hasDraftVersion,
    hasVerified: hasVerifiedVersion,
  });
  const selectedVersion = miniAppNav.version;
  const isMiniAppEnabled =
    selectedVersion === "approved" ? hasVerifiedMiniApp : hasDraftMiniApp;
  const getVersionedPath = (path: string) =>
    appendVersionParam({
      path,
      version: selectedVersion,
      hasDraft: hasDraftVersion,
      hasVerified: hasVerifiedVersion,
    });
  const dashboardPath = getVersionedPath(`/teams/${teamId}/apps/${appId}`);
  const configurationPath = getVersionedPath(
    `/teams/${teamId}/apps/${appId}/configuration`,
  );
  const actionsPath = getVersionedPath(
    `/teams/${teamId}/apps/${appId}/actions`,
  );
  const worldIdPath = hasRpRegistration
    ? getVersionedPath(`/teams/${teamId}/apps/${appId}/world-id-4-0`)
    : hasLegacyActions
      ? actionsPath
      : getVersionedPath(
          urls.enableWorldId40({
            team_id: teamId,
            app_id: appId,
            next: "actions",
          }),
        );
  const signInWithWorldIdPath = getVersionedPath(
    `/teams/${teamId}/apps/${appId}/sign-in-with-world-id`,
  );

  const isWorldIdSegment =
    segment === "world-id-4-0" ||
    segment === "world-id-actions" ||
    segment === "actions";
  const isMiniAppSegment =
    segment === "mini-app" ||
    segment === "transactions" ||
    segment === "notifications";

  if (showWorldId40Nav) {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="md:border-b md:border-grey-100">
          <SizingWrapper gridClassName="hidden md:grid" variant="nav">
            <Tabs className="m-auto font-gta">
              <Tab href={dashboardPath} underlined segment={null}>
                <Typography variant={TYPOGRAPHY.R4}>Dashboard</Typography>
              </Tab>

              <Tab
                href={worldIdPath}
                underlined
                active={isWorldIdSegment}
                segment={"world-id-4-0"}
              >
                <Typography variant={TYPOGRAPHY.R4}>World ID</Typography>
              </Tab>

              <Tab
                href={configurationPath}
                underlined
                segment={"configuration"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Configuration</Typography>
              </Tab>

              {isMiniAppEnabled && (
                <Tab
                  href={miniAppNav.permissionsPath}
                  underlined
                  active={isMiniAppSegment}
                  segment={"mini-app"}
                >
                  <Typography variant={TYPOGRAPHY.R4}>Mini App</Typography>
                </Tab>
              )}
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
                    href: getVersionedPath(
                      `/teams/${teamId}/apps/${appId}/world-id-4-0`,
                    ),
                    segment: "world-id-4-0",
                    hidden: !hasRpRegistration,
                  },
                  {
                    label: "Actions",
                    href: getVersionedPath(
                      `/teams/${teamId}/apps/${appId}/world-id-actions`,
                    ),
                    segment: "world-id-actions",
                  },
                  {
                    label: "World ID 3.0 Legacy",
                    href: actionsPath,
                    segment: "actions",
                    hidden: !hasLegacyActions,
                  },
                ]}
              />
            </SizingWrapper>
          </div>
        )}

        {isMiniAppEnabled && isMiniAppSegment && (
          <div className="md:border-b md:border-grey-100 md:bg-grey-50">
            <SizingWrapper gridClassName="hidden md:grid" variant="nav">
              <SectionSubTabs
                items={[
                  {
                    label: "Permissions",
                    href: miniAppNav.permissionsPath,
                    segment: "mini-app",
                    active: miniAppNav.isPermissionsActive,
                  },
                  {
                    label: "Transactions",
                    href: miniAppNav.transactionsPath,
                    segment: "mini-app",
                    active: miniAppNav.isTransactionsActive,
                  },
                  {
                    label: "Notifications",
                    href: miniAppNav.notificationsPath,
                    segment: "mini-app",
                    active: miniAppNav.isNotificationsActive,
                  },
                ]}
              />
            </SizingWrapper>
          </div>
        )}

        {children}

        <BottomBar className="order-last mt-auto">
          <BottomBar.Link href={dashboardPath} segment={null}>
            <DashboardSquareIcon className="size-7" />
          </BottomBar.Link>

          <BottomBar.Link
            href={worldIdPath}
            segment={"world-id-4-0"}
            active={isWorldIdSegment}
          >
            <AppIcon className="size-7" />
          </BottomBar.Link>

          <BottomBar.Link href={configurationPath} segment={"configuration"}>
            <SecurityIcon className="size-7" />
          </BottomBar.Link>

          {isMiniAppEnabled && (
            <BottomBar.Link
              href={miniAppNav.permissionsPath}
              segment={"mini-app"}
            >
              <WalletIcon className="size-7" />
            </BottomBar.Link>
          )}
        </BottomBar>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="md:border-b md:border-grey-100">
        <SizingWrapper gridClassName="hidden md:grid" variant="nav">
          <Tabs className="m-auto font-gta">
            <Tab href={dashboardPath} underlined segment={null}>
              <Typography variant={TYPOGRAPHY.R4}>Dashboard</Typography>
            </Tab>

            <Tab href={configurationPath} underlined segment={"configuration"}>
              <Typography variant={TYPOGRAPHY.R4}>Configuration</Typography>
            </Tab>

            <Tab href={actionsPath} underlined segment={"actions"}>
              <Typography variant={TYPOGRAPHY.R4}>Incognito actions</Typography>
            </Tab>

            {!isOnChainApp && (
              <Tab
                href={signInWithWorldIdPath}
                underlined
                segment={"sign-in-with-world-id"}
              >
                <Typography variant={TYPOGRAPHY.R4}>
                  Sign in with World ID
                </Typography>
              </Tab>
            )}

            {isMiniAppEnabled && (
              <Tab
                href={miniAppNav.transactionsPath}
                underlined
                segment={"mini-app"}
                active={miniAppNav.isTransactionsActive}
              >
                <Typography variant={TYPOGRAPHY.R4}>Transactions</Typography>
              </Tab>
            )}
            {isMiniAppEnabled && (
              <Tab
                href={miniAppNav.notificationsPath}
                underlined
                segment={"mini-app"}
                active={miniAppNav.isNotificationsActive}
              >
                <Typography variant={TYPOGRAPHY.R4}>Notifications</Typography>
              </Tab>
            )}

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
        <BottomBar.Link href={dashboardPath} segment={null}>
          <DashboardSquareIcon className="size-7" />
        </BottomBar.Link>

        <BottomBar.Link href={actionsPath} segment={"actions"}>
          <IncognitoIcon className="size-7" />
        </BottomBar.Link>

        <BottomBar.Link
          href={signInWithWorldIdPath}
          segment={"sign-in-with-world-id"}
        >
          <UserAccountIcon className="size-7" />
        </BottomBar.Link>

        <BottomBar.Link href={configurationPath} segment={"configuration"}>
          <SecurityIcon className="size-7" />
        </BottomBar.Link>
        {isMiniAppEnabled && (
          <BottomBar.Link
            href={miniAppNav.transactionsPath}
            segment={"mini-app"}
          >
            <TransactionIcon className="size-7" />
          </BottomBar.Link>
        )}
      </BottomBar>
    </div>
  );
};
