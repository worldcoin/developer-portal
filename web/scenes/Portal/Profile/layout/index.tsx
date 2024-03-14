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

      {props.children}
    </div>
  );
};

