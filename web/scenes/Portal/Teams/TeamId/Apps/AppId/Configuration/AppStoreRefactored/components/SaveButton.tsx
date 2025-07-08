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
    <div className="fixed inset-x-0 bottom-0 z-50 h-32 bg-transparent shadow-lg">
      <div className="mx-auto grid max-w-[580px] grid-cols-1fr/auto px-8 pt-2 md:pt-8">
        <div></div>
        <div className="flex justify-end">
          <DecoratedButton
            type="submit"
            variant="primary"
            className="h-12 w-40"
            disabled={isDisabled}
            onClick={onSubmit}
          >
            <Typography variant={TYPOGRAPHY.M3}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Typography>
          </DecoratedButton>
        </div>
        <div></div>
      </div>
    </div>
  );
};
