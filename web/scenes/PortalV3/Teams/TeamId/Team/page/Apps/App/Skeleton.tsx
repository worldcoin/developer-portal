"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Skeleton from "react-loading-skeleton";
import { appCardFrameClassName } from "./index";

/** Mirrors `App`: same frame, logo slot, and text line metrics — only the
 *  data (logo, name, environment) shimmers. */
export const AppCardSkeleton = () => (
  <div aria-hidden className={appCardFrameClassName}>
    <Skeleton className="size-16 rounded-2xl leading-normal" inline />

    <div className="grid max-w-[200px] justify-center justify-items-center gap-y-1">
      <Typography variant={TYPOGRAPHY.M3}>
        <Skeleton width={120} />
      </Typography>
      {/* Environment row: R4 line inside py-1, its tallest segment. */}
      <div className="flex items-center py-1">
        <Typography variant={TYPOGRAPHY.R4}>
          <Skeleton width={96} />
        </Typography>
      </div>
    </div>
  </div>
);
