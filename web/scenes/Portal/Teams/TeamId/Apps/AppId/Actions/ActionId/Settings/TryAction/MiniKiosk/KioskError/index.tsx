import { memo, useMemo } from "react";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

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
    <div className="grid text-center justify-items-center gap-y-6">
      <div className="grid gap-y-4 px-12 justify-items-center">
        <div className="font-rubik grid gap-y-2 leading-[1.2]">
          <CircleIconContainer variant="error">
            <CloseIcon className="h-4 w-4 text-system-error-500" />
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
          className="max-w-full px-8"
          color="primary"
          onClick={reset}
        >
          <Typography variant={TYPOGRAPHY.M3}>{buttonText}</Typography>
        </DecoratedButton>
      )}
    </div>
  );
});
