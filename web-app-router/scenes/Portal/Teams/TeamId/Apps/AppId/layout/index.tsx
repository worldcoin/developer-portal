"use client";
import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { useParams } from "next/navigation";

export const AppIdLayout = (props: { children: ReactNode }) => {
  const params = useParams<{ teamId: string; appId: string }>();
  return (
    <div>
      <div className="border-b border-grey-100">
        <Tabs className="max-w-[1180px] m-auto font-gta">
          <Tab
            href={`/teams/${params!.teamId}/apps/${params!.appId}`}
            underlined
            segment={null}
          >
            Dashboard
          </Tab>

          <Tab
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile`}
            underlined
            segment={"profile"}
          >
            App profile
          </Tab>

          <Tab
            href={`/teams/${params!.teamId}/apps/${params!.appId}/actions`}
            underlined
            segment={"actions"}
          >
            Incognito actions
          </Tab>
          <Tab
            href={`/teams/${params!.teamId}/apps/${params!.appId}/sign-in-with-world-id`}
            underlined
            segment={"sign-in-with-world-id"}
          >
            Sign in with World ID
          </Tab>
        </Tabs>
      </div>

      {props.children}
    </div>
  );
};
