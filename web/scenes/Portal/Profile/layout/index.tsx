import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ReactNode } from "react";

export const ProfileLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <div className="border-b border-grey-100 bg-grey-50">
        <SizingWrapper variant="nav">
          <Tabs className="font-gta">
            <Tab className="py-4" href={`/profile`} segment={null}>
              <Typography variant={TYPOGRAPHY.R4}>User profile</Typography>
            </Tab>

            <Tab className="py-4" href={`/profile/teams`} segment={"teams"}>
              <Typography variant={TYPOGRAPHY.R4}>Teams</Typography>
            </Tab>

            <Tab className="py-4" href={`/profile/danger`} segment={"danger"}>
              <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
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
