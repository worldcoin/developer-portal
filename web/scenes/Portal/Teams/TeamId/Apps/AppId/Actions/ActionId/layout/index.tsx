import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { ActionsHeader } from "@/components/ActionsHeader";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser, EngineType } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { ReactNode } from "react";
import { getSdk as getAppEnvSdk } from "./graphql/server/fetch-app-env.generated";
import { getSdk as getActionNameSdk } from "./graphql/server/get-action-name.generated";

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

  // Fetch app environment data
  const { app } = await getAppEnvSdk(client).FetchAppEnv({
    id: params.appId ?? "",
  });

  const isOnChainApp = app?.[0]?.engine === EngineType.OnChain;
  const hasRpRegistration = (app?.[0]?.rp_registration?.length ?? 0) > 0;

  // Fetch action data for header
  const { action_by_pk } = await getActionNameSdk(client).GetActionName({
    action_id: params.actionId ?? "",
  });

  // Handle 404 if action not found
  if (!action_by_pk) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  }

  return (
    <>
      {/* Header Section */}
      <SizingWrapper gridClassName="order-1 pt-6 md:pt-10">
        <ActionsHeader
          displayText={action_by_pk.name}
          backText={
            hasRpRegistration
              ? "Back to Legacy Actions"
              : "Back to Incognito Actions"
          }
          backUrl={urls.actions({
            team_id: params.teamId ?? "",
            app_id: params.appId,
          })}
          isLoading={false}
          isDeprecated={hasRpRegistration}
          analyticsContext={{
            teamId: params.teamId,
            appId: params.appId,
            actionId: params.actionId,
            location: "actions",
          }}
        />
      </SizingWrapper>

      {/* Tabs Section */}
      <SizingWrapper gridClassName="order-2 pt-2">
        <Tabs className="border-b border-grey-100 font-gta md:py-0">
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

      {/* Page Content */}
      <div className="order-3 w-full">{props.children}</div>
    </>
  );
};
