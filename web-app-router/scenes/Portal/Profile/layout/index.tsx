import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { SizingWrapper } from "@/components/SizingWrapper";

export const ProfileLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <div className="bg-grey-50 border-b border-grey-100">
        <SizingWrapper variant="nav">
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

      {/*<div className="pt-9">*/}
      {/*  <SizingWrapper className="grid gap-y-8">*/}
      {/*    <UserInfo email={user?.email} name={user?.name} />*/}

      {/*    <div className="border-b border-grey-200 border-dashed" />*/}
      {/*  </SizingWrapper>*/}
      {/*</div>*/}

      {props.children}
    </div>
  );
};
