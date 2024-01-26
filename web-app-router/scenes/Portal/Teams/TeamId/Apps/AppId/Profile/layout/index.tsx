"use client";
import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { useParams } from "next/navigation";

export const AppProfileLayout = (props: { children: ReactNode }) => {
  const params = useParams<{ teamId: string; appId: string }>();
  return (
    <div>
      <div className="bg-grey-50 border-b border-grey-100">
        <Tabs className="max-w-[1180px] m-auto">
          <Tab
            className="py-4"
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile`}
          >
            Overview
          </Tab>

          <Tab
            className="py-4"
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/store-info`}
          >
            Store info
          </Tab>

          <Tab
            className="py-4"
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/gallery`}
          >
            Gallery
          </Tab>

          <Tab
            className="py-4"
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/links`}
          >
            Links
          </Tab>

          <Tab
            className="py-4"
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/danger`}
          >
            Danger zone
          </Tab>
        </Tabs>
      </div>

      {props.children}
    </div>
  );
};
