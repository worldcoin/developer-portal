import {
  FormDialog,
  FormDialogButton,
  FormDialogFooter,
} from "@/components/FormDialog";
import { ApiKeySecretFields } from "../../ApiKeySecretFields";

type RotateKeyModalProps = {
  isOpen: boolean;
  name?: string;
  loading: boolean;
  rotatedKey: string | null;
  onConfirm: () => void;
  onClose: () => void;
  afterLeave?: () => void;
};

export const RotateKeyModal = (props: RotateKeyModalProps) => {
  const { isOpen, name, loading, rotatedKey, onConfirm, onClose, afterLeave } =
    props;

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      afterLeave={afterLeave}
      // Confirming rotation invalidates the old key server-side and the response
      // carries the only copy of the new one, so there is no safe exit between
      // the two: hold the user here until the reveal renders. A failed rotation
      // clears `loading` with no secret, which unlocks the dialog again rather
      // than trapping them on a dead confirm view.
      dismissable={!loading}
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

          <FormDialogButton onClick={onClose}>Done</FormDialogButton>
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

          <FormDialogFooter>
            <FormDialogButton
              variant="danger"
              loading={loading}
              onClick={onConfirm}
              // Keeps an accessible name while the label is a spinner.
              aria-label="Rotate key"
            >
              Rotate key
            </FormDialogButton>

            <FormDialogButton disabled={loading} onClick={onClose}>
              Keep current key
            </FormDialogButton>
          </FormDialogFooter>
        </div>
      )}
    </FormDialog>
  );
};
