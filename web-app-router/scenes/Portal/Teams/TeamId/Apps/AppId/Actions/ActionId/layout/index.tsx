"use client";
import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { useParams } from "next/navigation";
import { SizingWrapper } from "@/components/SizingWrapper";

export const ActionIdLayout = (props: { children: ReactNode }) => {
  const params = useParams<{
    teamId: string;
    appId: string;
    actionId: string;
  }>();
  return (
    <div className="h-full w-full">
      <div className="bg-grey-50 border-b border-grey-100">
        <SizingWrapper>
          <Tabs className="max-w-[1180px] m-auto font-gta">
            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}`}
              segment={null}
            >
              Overview
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/settings`}
              segment={"settings"}
            >
              Settings
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/proof-debugging`}
              segment={"proof-debugging"}
            >
              Proof debugging
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/danger`}
              segment={"danger"}
            >
              Danger zone
            </Tab>
          </Tabs>
        </SizingWrapper>
      </div>

      <SizingWrapper className="h-full">{props.children}</SizingWrapper>
    </div>
  );
};
