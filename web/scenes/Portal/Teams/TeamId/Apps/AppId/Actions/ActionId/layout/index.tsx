import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser, EngineType } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { ReactNode } from "react";
import { getSdk as getAppEnv } from "./graphql/server/fetch-app-env.generated";

type Params = {
  teamId?: string;
  appId?: string;
  actionId?: string;
};

type ActionIdLayout = {
  params: Params;
  children: ReactNode;
};

export const ActionIdLayout = async (props: ActionIdLayout) => {
  const params = props.params;
  const session = await getSession();
  const client = await getAPIServiceGraphqlClient();
  const user = session?.user as Auth0SessionUser["user"];

  const isEnoughPermissions = checkUserPermissions(user, params.teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);

  const { app } = await getAppEnv(client).FetchAppEnv({
    id: params.appId ?? "",
  });

  const isOnChainApp = app?.[0]?.engine === EngineType.OnChain;

  return (
    <div className="flex flex-col items-start">
      <div className="order-2 w-full md:order-1 md:border-b md:border-grey-100 md:bg-grey-50">
        <SizingWrapper variant="nav">
          <Tabs className="px-6 py-4 font-gta md:py-0">
            {!isOnChainApp && (
              <Tab
                className="md:py-4"
                href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}`}
                segment={null}
              >
                <Typography variant={TYPOGRAPHY.R4}>Overview</Typography>
              </Tab>
            )}

            <Tab
              className="md:py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/settings`}
              segment={"settings"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Settings</Typography>
            </Tab>

            <Tab
              className="md:py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/proof-debugging`}
              segment={"proof-debugging"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Proof debugging</Typography>
            </Tab>

            {!isOnChainApp && (
              <Tab
                className="md:py-4"
                href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/kiosk`}
                segment={"kiosk"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Kiosk</Typography>
              </Tab>
            )}

            {isEnoughPermissions && (
              <Tab
                className="md:py-4"
                href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/danger`}
                segment={"danger"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
              </Tab>
            )}
          </Tabs>
        </SizingWrapper>
      </div>

      {props.children}
    </div>
  );
};
