"use client";

import { TeamProfile } from "@/scenes/PortalV3/Teams/TeamId/Team/common/TeamProfile";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Apps } from "@/scenes/PortalV3/Teams/TeamId/Team/page/Apps";

export const AppsPage = () => {
  return (
    <>
      <SizingWrapper gridClassName="order-1">
        <TeamProfile />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col">
        <Apps />
      </SizingWrapper>
    </>
  );
};
