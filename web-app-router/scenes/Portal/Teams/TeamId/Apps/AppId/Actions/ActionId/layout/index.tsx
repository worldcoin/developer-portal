"use client";
import { ReactNode, useMemo } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { useParams } from "next/navigation";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { Role_Enum } from "@/graphql/graphql";

export const ActionIdLayout = (props: { children: ReactNode }) => {
  const params = useParams<{
    teamId: string;
    appId: string;
    actionId: string;
  }>();
  const { user } = useUser() as Auth0SessionUser;

  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === params?.teamId,
    );
    return (
      membership?.role === Role_Enum.Owner ||
      membership?.role === Role_Enum.Admin
    );
  }, [params?.teamId, user?.hasura.memberships]);

  // TODO: Remove tabs for on chain apps
  return (
    <div className="h-full w-full">
      <div className="bg-grey-50 border-b border-grey-100">
        <SizingWrapper variant="nav">
          <Tabs className="m-auto font-gta">
            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}`}
              segment={null}
            >
              <Typography variant={TYPOGRAPHY.R4}>Overview</Typography>
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/settings`}
              segment={"settings"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Settings</Typography>
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/proof-debugging`}
              segment={"proof-debugging"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Proof debugging</Typography>
            </Tab>
            {isEnoughPermissions && (
              <Tab
                className="py-4"
                href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/danger`}
                segment={"danger"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
              </Tab>
            )}
          </Tabs>
        </SizingWrapper>
      </div>

      <SizingWrapper className="h-full">{props.children}</SizingWrapper>
    </div>
  );
};
