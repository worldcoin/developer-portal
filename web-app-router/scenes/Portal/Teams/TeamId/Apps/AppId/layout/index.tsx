"use client";
import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { useParams } from "next/navigation";

export const AppIdLayout = (props: { children: ReactNode }) => {
  const params = useParams<{ teamId: string; appId: string }>();
  return (
    <div>
      <div className="border-b border-grey-100">
        <Tabs className="max-w-[1180px] m-auto">
          <Tab
            href={`/teams/${params!.teamId}/apps/${params!.appId}`}
            underlined
          >
            Dashboard
          </Tab>

          <Tab
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile`}
            underlined
          >
            App profile
          </Tab>

          <Tab
            href={`/teams/${params!.teamId}/apps/${params!.appId}/actions`}
            underlined
          >
            Incognito actions
          </Tab>
        </Tabs>
      </div>

      {props.children}
    </div>
  );
};
