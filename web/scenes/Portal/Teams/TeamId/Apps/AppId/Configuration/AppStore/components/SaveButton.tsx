import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type SaveButtonProps = {
  isSubmitting: boolean;
  isDisabled: boolean;
  onSubmit: () => void;
};

export const SaveButton = ({
  isSubmitting,
  isDisabled,
  onSubmit,
}: SaveButtonProps) => {
  return (
    <DecoratedButton
      type="button"
      variant="primary"
      className="h-12 w-40"
      disabled={isDisabled}
      onClick={onSubmit}
    >
      <Typography variant={TYPOGRAPHY.M3}>
        {isSubmitting ? "Saving..." : "Save changes"}
      </Typography>
    </DecoratedButton>
  );
};
