"use client";

import { ActionsHeader } from "@/components/ActionsHeader";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { useAtomValue } from "jotai";
import { worldId40Atom, isWorldId40Enabled } from "@/lib/feature-flags";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser, EngineType } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ReactNode } from "react";
import { useGetSingleActionAndNullifiersQuery } from "../page/graphql/client/get-single-action.generated";

type Params = {
  teamId?: string;
  appId?: string;
  actionId?: string;
};

type ActionIdLayout = {
  params: Params;
  children: ReactNode;
};

export const ActionIdLayout = (props: ActionIdLayout) => {
  const params = props.params;
  const { user } = useUser() as Auth0SessionUser;

  // Fetch action data for header using user permissions
  const { data, loading } = useGetSingleActionAndNullifiersQuery({
    variables: {
      action_id: params.actionId ?? "",
    },
    skip: !params.actionId,
  });

  const action = data?.action?.[0];
  const app = action?.app;

  const isOnChainApp = app?.engine === EngineType.OnChain;
  const worldId40Config = useAtomValue(worldId40Atom);
  const isEnabled = isWorldId40Enabled(worldId40Config, params.teamId);

  const isEnoughPermissions = checkUserPermissions(user, params.teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);

  // Handle 404 if action not found (only after loading completes)
  if (!loading && !action) {
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
          displayText={action?.name ?? ""}
          backText={
            isEnabled ? "Back to Legacy Actions" : "Back to Incognito Actions"
          }
          backUrl={urls.actions({
            team_id: params.teamId ?? "",
            app_id: params.appId,
          })}
          isLoading={loading}
          isDeprecated={isEnabled}
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
