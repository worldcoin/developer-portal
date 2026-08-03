import { CopyButton } from "@/components/CopyButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";

/**
 * Skeleton twin of SummaryField: same wrappers and type ramp, real label,
 * shimmer in the value slot. Used for fields whose label is identical across
 * the registered and unregistered configuration variants but whose value
 * needs data.
 */
export const SummaryFieldSkeleton = (props: { label: string }) => (
  <div className="w-full min-w-0">
    <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
      {props.label}
    </Typography>
    <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
      <Typography
        aria-hidden
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
