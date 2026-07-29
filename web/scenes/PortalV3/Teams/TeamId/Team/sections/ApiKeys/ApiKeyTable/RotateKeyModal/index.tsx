import {
  FormDialog,
  formDialogDangerActionClassName,
  formDialogPrimaryActionClassName,
} from "@/components/FormDialog";
import { ApiKeySecretFields } from "../../ApiKeySecretFields";

type RotateKeyModalProps = {
  isOpen: boolean;
  name?: string;
  loading: boolean;
  rotatedKey: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export const RotateKeyModal = (props: RotateKeyModalProps) => {
  const { isOpen, name, loading, rotatedKey, onConfirm, onClose } = props;

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={rotatedKey ? "API key rotated" : "Are you sure?"}
      closeLabel="Close rotate key dialog"
      panelClassName={
        rotatedKey
          ? "max-h-[calc(100dvh-2rem)] md:w-[544px] md:max-w-[calc(100vw-2rem)]"
          : undefined
      }
      bodyClassName={rotatedKey ? "min-h-0 overflow-y-auto" : undefined}
    >
      {rotatedKey ? (
        <div className="grid w-full gap-y-5">
          <p className="font-world text-14 leading-[1.5] text-portal-muted">
            Your new API key is ready. Save it now because you {"won't"} be able
            to see it again.
          </p>

          <ApiKeySecretFields apiKey={rotatedKey} />

          <button
            type="button"
            className={formDialogPrimaryActionClassName}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          {/* Consequence stays in one trailing text node so getByText can match it. */}
          <p className="font-world text-13 leading-[1.5] text-portal-muted">
            Rotating{" "}
            <span className="font-medium text-portal-text">{name}</span> will
            stop working immediately anywhere it is already deployed, and the
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
              onClick={onClose}
              className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
            >
              Keep current key
            </button>
          </div>
        </div>
      )}
    </FormDialog>
  );
};
