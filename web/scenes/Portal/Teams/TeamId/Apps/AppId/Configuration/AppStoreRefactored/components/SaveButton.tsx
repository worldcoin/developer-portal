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
      {/* copied from sizing wrapper */}
      <div className="grid grid-cols-[minmax(24px,1fr)_minmax(0,calc(1440px-9vw*2))_minmax(24px,1fr)] pr-3 pt-2 md:pt-8">
        <div className="col-start-2 flex justify-self-end">
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
      </div>
    </div>
  );
};
