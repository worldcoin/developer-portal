import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SuccessIcon } from "@/components/Icons/SuccessIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { memo } from "react";

export const Success = memo(function Success(props: { reset: () => void }) {
  const { reset } = props;

  return (
    <div className="grid items-center justify-items-center gap-y-6 text-center ">
      <div className="grid max-w-[300px] justify-items-center gap-y-4 px-2">
        <div className="grid gap-y-2 font-rubik leading-[1.2]">
          <CircleIconContainer variant="success">
            <SuccessIcon className="size-4 text-system-success-500" />
          </CircleIconContainer>
        </div>
        <Typography variant={TYPOGRAPHY.H6}>Verified successfully!</Typography>
      </div>

      <DecoratedButton
        type="button"
        variant="secondary"
        className={clsx()}
        onClick={reset}
      >
        <Typography variant={TYPOGRAPHY.M3}>New Verification</Typography>
      </DecoratedButton>
    </div>
  );
});
