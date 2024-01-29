"use client";
import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { SizingWrapper } from "@/components/SizingWrapper";

export const ProfileLayout = (props: { children: ReactNode }) => (
  <div>
    <div className="bg-grey-50 border-b border-grey-100">
      <SizingWrapper>
        <Tabs className="font-gta">
          <Tab className="py-4" href={`/profile`} segment={null}>
            User profile
          </Tab>

          <Tab className="py-4" href={`/profile/teams`} segment={"teams"}>
            Teams
          </Tab>

          <Tab className="py-4" href={`/profile/danger`} segment={"danger"}>
            Danger zone
          </Tab>
        </Tabs>
      </SizingWrapper>
    </div>

    {props.children}
  </div>
);
