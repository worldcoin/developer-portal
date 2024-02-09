"use client";
import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { useParams } from "next/navigation";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

export const AppIdLayout = (props: { children: ReactNode }) => {
  const params = useParams<{ teamId: string; appId: string }>();
  return (
    <div>
      <div className="border-b border-grey-100">
        <SizingWrapper>
          <Tabs className="max-w-[1180px] m-auto font-gta">
            <Tab
              href={`/teams/${params!.teamId}/apps/${params!.appId}`}
              underlined
              segment={null}
            >
              <Typography variant={TYPOGRAPHY.R4}>Dashboard</Typography>
            </Tab>

            <Tab
              href={`/teams/${params!.teamId}/apps/${params!.appId}/profile`}
              underlined
              segment={"profile"}
            >
              <Typography variant={TYPOGRAPHY.R4}>App profile</Typography>
            </Tab>

            <Tab
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions`}
              underlined
              segment={"actions"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Incognito actions</Typography>
            </Tab>
            <Tab
              href={`/teams/${params!.teamId}/apps/${params!.appId}/sign-in-with-world-id`}
              underlined
              segment={"sign-in-with-world-id"}
            >
              <Typography variant={TYPOGRAPHY.R4}>
                Sign in with World ID
              </Typography>
            </Tab>
          </Tabs>
        </SizingWrapper>
      </div>
      {props.children}
    </div>
  );
};
