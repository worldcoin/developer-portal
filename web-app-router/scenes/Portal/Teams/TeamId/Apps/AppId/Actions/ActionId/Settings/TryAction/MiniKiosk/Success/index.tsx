import { memo } from "react";
import clsx from "clsx";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { SuccessIcon } from "@/components/Icons/SuccessIcon";

export const Success = memo(function Success(props: { reset: () => void }) {
  const { reset } = props;

  return (
    <div className="grid items-center text-center justify-items-center gap-y-6 ">
      <div className="grid px-2 max-w-[300px] gap-y-4 justify-items-center">
        <div className="font-rubik grid gap-y-2 leading-[1.2]">
          <CircleIconContainer variant="success">
            <SuccessIcon className="h-4 w-4 text-system-success-500" />
          </CircleIconContainer>
        </div>
        <p className="font-sora font-semibold text-[26px] leading-[1.2]">
          Verified successfully!
        </p>
      </div>

      <DecoratedButton
        type="button"
        variant="secondary"
        className={clsx()}
        onClick={reset}
      >
        New Verification
      </DecoratedButton>
    </div>
  );
});
