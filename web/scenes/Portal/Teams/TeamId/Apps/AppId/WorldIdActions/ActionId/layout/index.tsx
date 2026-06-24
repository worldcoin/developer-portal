"use client";

import { ActionsHeader } from "@/components/ActionsHeader";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useTeamPermission } from "@/lib/team-permissions/use-team-permission";
import { urls } from "@/lib/urls";
import { ReactNode, use } from "react";
import { useGetSingleActionV4Query } from "../page/graphql/client/get-single-action-v4.generated";

type Params = {
  teamId?: string;
  appId?: string;
  actionId?: string;
};

type WorldIdActionIdLayoutProps = {
  params: Promise<Params>;
  children: ReactNode;
};

export const WorldIdActionIdLayout = (props: WorldIdActionIdLayoutProps) => {
  const params = use(props.params);
  const deletePermission = useTeamPermission(
    params.teamId ?? "",
    "delete_world_id_action",
  );

  // Fetch action data for header using user permissions
  const { data, loading } = useGetSingleActionV4Query({
    variables: {
      action_id: params.actionId ?? "",
    },
    skip: !params.actionId,
  });

  const action_v4_by_pk = data?.action_v4_by_pk;

  // Validate app ownership - action must belong to the app in URL
  if (!loading && action_v4_by_pk) {
    const actionAppId = action_v4_by_pk.rp_registration?.app_id;
    if (actionAppId && actionAppId !== params.appId) {
      return (
        <SizingWrapper gridClassName="order-1 md:order-2">
          <ErrorPage statusCode={404} title="Action not found" />
        </SizingWrapper>
      );
    }
  }

  // Handle 404 if action not found (only after loading completes)
  if (!loading && !action_v4_by_pk) {
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
          displayText={action_v4_by_pk?.action ?? ""}
          backText="Back to Actions"
          backUrl={urls.worldIdActions({
            team_id: params.teamId ?? "",
            app_id: params.appId,
          })}
          isLoading={loading}
          analyticsContext={{
            teamId: params.teamId,
            appId: params.appId,
            actionId: params.actionId,
            location: "world-id-actions",
          }}
        />
      </SizingWrapper>

      {/* Tabs Section */}
      <SizingWrapper gridClassName="order-2 pt-2">
        <Tabs className="border-b border-grey-100 pb-2 font-gta md:py-0 md:pb-0">
          <Tab
            className="md:py-4"
            href={urls.worldIdAction({
              team_id: params.teamId ?? "",
              app_id: params.appId ?? "",
              action_id: params.actionId ?? "",
            })}
            segment={null}
          >
            <Typography variant={TYPOGRAPHY.R4}>Overview</Typography>
          </Tab>

          <Tab
            className="md:py-4"
            href={urls.worldIdActionSettings({
              team_id: params.teamId ?? "",
              app_id: params.appId ?? "",
              action_id: params.actionId ?? "",
            })}
            segment={"settings"}
          >
            <Typography variant={TYPOGRAPHY.R4}>Settings</Typography>
          </Tab>

          {deletePermission.allowed && (
            <Tab
              className="md:py-4"
              href={urls.worldIdActionDanger({
                team_id: params.teamId ?? "",
                app_id: params.appId ?? "",
                action_id: params.actionId ?? "",
              })}
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
