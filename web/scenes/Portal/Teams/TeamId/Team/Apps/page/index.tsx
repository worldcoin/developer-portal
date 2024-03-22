"use client";

import { TeamProfile } from "@/scenes/Portal/Teams/TeamId/Team/common/TeamProfile";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Apps } from "@/scenes/Portal/Teams/TeamId/Team/page/Apps";

export const AppsPage = () => {
  return (
    <>
      <SizingWrapper gridClassName="order-1">
        <TeamProfile />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2">
        <Apps />
      </SizingWrapper>
    </>
  );
};
