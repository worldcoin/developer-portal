"use client";

import { BottomBar } from "@/components/BottomBar";
import { AppIcon } from "@/components/Icons/AppIcon";
import { DashboardSquareIcon } from "@/components/Icons/DashboardSquareIcon";
import { IncognitoIcon } from "@/components/Icons/IncognitoIcon";
import { TransactionIcon } from "@/components/Icons/TransactionIcon";
import { UserAccountIcon } from "@/components/Icons/UserAccountIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

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
  return pathname === enablePath || pathname === configurePath;
}

type AppIdChromeProps = {
  params: { teamId?: string; appId?: string };
  isOnChainApp: boolean;
  children: ReactNode;
};

export const AppIdChrome = ({
  params,
  isOnChainApp,
  children,
}: AppIdChromeProps) => {
  const pathname = usePathname();

  if (isOnboardingPath(pathname, params)) {
    return <>{children}</>;
  }

  const { teamId, appId } = params;
  if (!teamId || !appId) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col">
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

            {!isOnChainApp && (
              <Tab
                href={`/teams/${teamId}/apps/${appId}/sign-in-with-world-id`}
                underlined
                segment={"sign-in-with-world-id"}
              >
                <Typography variant={TYPOGRAPHY.R4}>
                  Sign in with World ID
                </Typography>
              </Tab>
            )}

            <Tab
              href={`/teams/${teamId}/apps/${appId}/transactions`}
              underlined
              segment={"transactions"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Transactions</Typography>
            </Tab>
            <Tab
              href={`/teams/${teamId}/apps/${appId}/notifications`}
              underlined
              segment={"notifications"}
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

      <BottomBar>
        <BottomBar.Link
          href={`/teams/${teamId}/apps/${appId}`}
          segment={null}
        >
          <DashboardSquareIcon className="size-7" />
        </BottomBar.Link>

        <BottomBar.Link
          href={`/teams/${teamId}/apps/${appId}/actions`}
          segment={"actions"}
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
          <AppIcon className="size-7" />
        </BottomBar.Link>
        <BottomBar.Link
          href={`/teams/${teamId}/apps/${appId}/transactions`}
          segment={"transactions"}
        >
          <TransactionIcon className="size-7" />
        </BottomBar.Link>
      </BottomBar>
    </div>
  );
};
