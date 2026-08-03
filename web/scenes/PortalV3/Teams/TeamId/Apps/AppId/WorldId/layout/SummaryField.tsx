import { CopyButton } from "@/components/CopyButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";

/**
 * Skeleton twin of SummaryField: same wrappers and type ramp, shimmer in both
 * slots. The label shimmers too — while the overview loads we don't know
 * whether summary fields render at all (an unregistered app shows the
 * register empty state instead), so no label text is asserted.
 */
export const SummaryFieldSkeleton = () => (
  <div aria-hidden className="w-full min-w-0">
    <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
      <Skeleton width={80} />
    </Typography>
    <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
      <Typography
        variant={TYPOGRAPHY.B3}
        className="min-w-0 grow text-grey-900"
      >
        <Skeleton width="60%" />
      </Typography>
    </div>
  </div>
);

export const SummaryField = (props: {
  label: string;
  value: string;
  copy?: boolean;
}) => (
  <div className="w-full min-w-0">
    <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
      {props.label}
    </Typography>
    <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
      <Typography
        variant={TYPOGRAPHY.B3}
        className="min-w-0 truncate text-grey-900"
        title={props.value}
      >
        {props.value}
      </Typography>
      {props.copy ? (
        <CopyButton
          fieldName={props.label}
          fieldValue={props.value}
          className="ml-auto shrink-0 !pr-0 text-grey-500"
          iconClassName={clsx("!size-4", opticalIconClassName)}
        />
      ) : null}
    </div>
  </div>
);
