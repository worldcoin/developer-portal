import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

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

  const title = isCountries ? "Remove all countries" : "Remove all languages";

  const description = isCountries
    ? "This will remove all countries from the Supported Countries list. This action cannot be undone."
    : "This will remove all languages from the Supported Languages list and permanently delete all related localization data. This action cannot be undone.";

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    // No typed verification: clearing the list only stages a change that the
    // surrounding form still has to save.
    <DeleteConfirmationDialog
      open={open}
      onClose={() => setOpen(false)}
      onConfirm={handleConfirm}
      title={title}
      description={description}
    />
  );
};
