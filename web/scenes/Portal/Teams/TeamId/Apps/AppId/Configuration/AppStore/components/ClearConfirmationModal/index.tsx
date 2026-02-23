import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type ClearConfirmationModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  type: "countries" | "languages";
  onConfirm: () => void;
};

export const ClearConfirmationModal = ({
  open,
  setOpen,
  type,
  onConfirm,
}: ClearConfirmationModalProps) => {
  const isCountries = type === "countries";

  const title = isCountries
    ? "Do you want to remove all the countries?"
    : "Do you want to remove all the languages?";

  const description = isCountries
    ? "This will remove all countries from the Supported Countries list. This action cannot be undone."
    : "This will remove all languages from the Supported Languages list except English. This action cannot be undone.";

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogOverlay />
      <DialogPanel className="gap-y-5 md:max-w-[36rem]">
        <CircleIconContainer variant="error">
          <TrashIcon className="size-6 text-red-500" />
        </CircleIconContainer>
        <div className="grid gap-y-10">
          <div className="grid grid-cols-1 justify-items-center gap-y-4">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              {title}
            </Typography>
            <Typography
              variant={TYPOGRAPHY.R3}
              className="text-center text-grey-500"
            >
              {description}
            </Typography>
          </div>
          <div className="grid w-full gap-4 md:grid-cols-2">
            <DecoratedButton
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              No
            </DecoratedButton>
            <DecoratedButton
              type="button"
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleConfirm}
            >
              Yes
            </DecoratedButton>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
