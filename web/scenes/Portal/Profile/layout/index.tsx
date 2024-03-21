import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ReactNode } from "react";

export const ProfileLayout = (props: { children: ReactNode }) => {
  return (
    <div className="flex grow flex-col items-start">
      <div className="order-2 w-full md:order-1 md:border-b md:border-grey-100 md:bg-grey-50">
        <SizingWrapper variant="nav">
          <Tabs className="px-6 py-4 font-gta md:py-0">
            <Tab className="md:py-4" href={`/profile`} segment={null}>
              <Typography variant={TYPOGRAPHY.R4}>User profile</Typography>
            </Tab>

            <Tab className="md:py-4" href={`/profile/teams`} segment={"teams"}>
              <Typography variant={TYPOGRAPHY.R4}>Teams</Typography>
            </Tab>

            <Tab
              className="md:py-4"
              href={`/profile/danger`}
              segment={"danger"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
            </Tab>
          </Tabs>
        </SizingWrapper>
      </div>

      {props.children}
    </div>
  );
};
