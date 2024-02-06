"use client";
import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { useParams } from "next/navigation";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

export const ActionIdLayout = (props: { children: ReactNode }) => {
  const params = useParams<{
    teamId: string;
    appId: string;
    actionId: string;
  }>();
  return (
    <div>
      <div className="bg-grey-50 border-b border-grey-100">
        <SizingWrapper>
          <Tabs className="max-w-[1180px] m-auto font-gta">
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

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/danger`}
              segment={"danger"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
            </Tab>
          </Tabs>
        </SizingWrapper>
      </div>

      <SizingWrapper>{props.children}</SizingWrapper>
    </div>
  );
};
