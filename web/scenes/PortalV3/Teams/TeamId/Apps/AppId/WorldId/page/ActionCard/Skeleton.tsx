"use client";

import Skeleton from "react-loading-skeleton";
import {
  actionCardDescriptionClassName,
  actionCardFrameClassName,
  actionCardTitleClassName,
} from "./index";

/** Card chrome renders for real; only the action name/description shimmer. */
export const ActionCardSkeleton = () => (
  <div aria-hidden className={actionCardFrameClassName}>
    <div className="flex flex-col gap-1">
      <span className={actionCardTitleClassName}>
        <Skeleton width="60%" />
      </span>
      <span className={actionCardDescriptionClassName}>
        <Skeleton width="85%" />
      </span>
    </div>
  </div>
);
