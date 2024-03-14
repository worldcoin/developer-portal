import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { memo, useMemo } from "react";

export const KioskError = memo(function KioskError(props: {
  buttonText?: string;
  description?: string;
  title: string;
  reset?: () => void;
}) {
  const { reset, buttonText, description, title } = props;

  const details = useMemo(() => {
    if (description) {
      return description;
    }
    return "Something went wrong. Please try again.";
  }, [description]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-y-6 text-center">
      <div className="grid max-w-[300px] justify-items-center gap-y-4 ">
        <div className="grid gap-y-2 font-rubik leading-[1.2]">
          <CircleIconContainer variant="error">
            <CloseIcon className="size-4 text-system-error-500" />
          </CircleIconContainer>
        </div>
        <Typography variant={TYPOGRAPHY.H6}>{title}</Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
          {details}
        </Typography>
      </div>

      {buttonText && (
        <DecoratedButton
          type="button"
          variant="secondary"
          className="h-fit max-w-full px-8"
          color="primary"
          onClick={reset}
        >
          <Typography variant={TYPOGRAPHY.M3}>{buttonText}</Typography>
        </DecoratedButton>
      )}
    </div>
  );
});

