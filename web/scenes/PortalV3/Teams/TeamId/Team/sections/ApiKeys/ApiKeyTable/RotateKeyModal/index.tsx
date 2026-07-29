import {
  FormDialog,
  formDialogDangerActionClassName,
  formDialogPrimaryActionClassName,
} from "@/components/FormDialog";

type RotateKeyModalProps = {
  isOpen: boolean;
  name?: string;
  loading: boolean;
  onConfirm: () => void;
  setIsOpen: (isOpen: boolean) => void;
};

export const RotateKeyModal = (props: RotateKeyModalProps) => {
  const { isOpen, name, loading, onConfirm, setIsOpen } = props;

  return (
    <FormDialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      title="Are you sure?"
      closeLabel="Close rotate key dialog"
    >
      <div className="grid gap-5">
        {/* Consequence stays in one trailing text node so getByText can match it. */}
        <p className="font-world text-13 leading-[1.5] text-portal-muted">
          Rotating <span className="font-medium text-portal-text">{name}</span>{" "}
          will stop working immediately anywhere it is already deployed, and the
          new key is shown only once.
        </p>

        <div className="grid w-full gap-3 md:grid-cols-2">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`${formDialogDangerActionClassName} order-2 md:order-none`}
          >
            Rotate key
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
          >
            Keep current key
          </button>
        </div>
      </div>
    </FormDialog>
  );
};
