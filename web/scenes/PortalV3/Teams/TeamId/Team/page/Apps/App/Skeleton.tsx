"use client";

import Skeleton from "react-loading-skeleton";
import { actionCardTitleClassName } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionCard";
import { appCardFrameClassName } from "./index";

/** Mirrors `App`: real card chrome with only the logo and name shimmering. */
export const AppCardSkeleton = () => (
  <div aria-hidden className={appCardFrameClassName}>
    <Skeleton className="size-16 rounded-2xl leading-normal" inline />

    <span className={`${actionCardTitleClassName} mt-auto block`}>
      <Skeleton width="60%" />
    </span>
  </div>
);
