"use client";
import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { useParams } from "next/navigation";
import { SizingWrapper } from "@/components/SizingWrapper";

export const AppProfileLayout = (props: { children: ReactNode }) => {
  const params = useParams<{ teamId: string; appId: string }>();
  return (
    <div>
      <div className="bg-grey-50 border-b border-grey-100">
        <SizingWrapper>
          <Tabs className="max-w-[1180px] m-auto font-gta">
            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/profile`}
              segment={null}
            >
              Overview
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/store-info`}
              segment={"store-info"}
            >
              Store info
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/gallery`}
              segment={"gallery"}
            >
              Gallery
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/links`}
              segment={"links"}
            >
              Links
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/danger`}
              segment={"danger"}
            >
              Danger zone
            </Tab>
          </Tabs>
        </SizingWrapper>
      </div>
      <SizingWrapper>{props.children}</SizingWrapper>
    </div>
  );
};
