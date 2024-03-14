import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { EngineType } from "@/lib/types";
import { ReactNode } from "react";
import { getSdk as getAppEnv } from "./graphql/server/fetch-app-env.generated";
import { BottomBar } from "@/components/BottomBar";
import { DashboardSquareIcon } from "@/components/Icons/DashboardSquareIcon";
import { IncognitoIcon } from "@/components/Icons/IncognitoIcon";
import { UserAccountIcon } from "@/components/Icons/UserAccountIcon";
import { AppIcon } from "@/components/Icons/AppIcon";

type Params = {
  teamId?: string;
  appId?: string;
};

type AppIdLayoutProps = {
  params: Params;
  children: ReactNode;
};

export const AppIdLayout = async (props: AppIdLayoutProps) => {
  const params = props.params;
  const client = await getAPIServiceGraphqlClient();
  const { app } = await getAppEnv(client).FetchAppEnv({
    id: params.appId ?? "",
  });

  const isOnChainApp = app?.[0]?.engine === EngineType.OnChain;

  return (
    <>
      <div className="border-b border-grey-100">
        <SizingWrapper gridClassName="hidden md:grid" variant="nav">
          <Tabs className="m-auto font-gta">
            <Tab
              href={`/teams/${params!.teamId}/apps/${params!.appId}`}
              underlined
              segment={null}
            >
              <Typography variant={TYPOGRAPHY.R4}>Dashboard</Typography>
            </Tab>

            <Tab
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions`}
              underlined
              segment={"actions"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Incognito actions</Typography>
            </Tab>

            {!isOnChainApp && (
              <Tab
                href={`/teams/${params!.teamId}/apps/${params!.appId}/sign-in-with-world-id`}
                underlined
                segment={"sign-in-with-world-id"}
              >
                <Typography variant={TYPOGRAPHY.R4}>
                  Sign in with World ID
                </Typography>
              </Tab>
            )}

            <Tab
              href={`/teams/${params!.teamId}/apps/${params!.appId}/profile`}
              underlined
              segment={"profile"}
            >
              <Typography variant={TYPOGRAPHY.R4}>App profile</Typography>
            </Tab>
          </Tabs>
        </SizingWrapper>
      </div>

      {props.children}

      <div className="grow" />

      <BottomBar>
        <BottomBar.Link
          href={`/teams/${params!.teamId}/apps/${params!.appId}`}
          segment={null}
        >
          <DashboardSquareIcon />
        </BottomBar.Link>

        <BottomBar.Link
          href={`/teams/${params!.teamId}/apps/${params!.appId}/actions`}
          segment={"actions"}
        >
          <IncognitoIcon />
        </BottomBar.Link>

        <BottomBar.Link
          href={`/teams/${params!.teamId}/apps/${params!.appId}/sign-in-with-world-id`}
          segment={"sign-in-with-world-id"}
        >
          <UserAccountIcon />
        </BottomBar.Link>

        <BottomBar.Link
          href={`/teams/${params!.teamId}/apps/${params!.appId}/profile`}
          segment={"profile"}
        >
          <AppIcon />
        </BottomBar.Link>
      </BottomBar>
    </>
  );
};
