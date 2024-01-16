import { Illustration } from "@/components/Auth/Illustration";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { memo, useCallback } from "react";
import useApps from "@/hooks/useApps";

export interface RemoveAppDialogProps {
  open: boolean;
  onClose: () => void;
}

export const RemoveAppDialog = memo(function RemoveAppDialog(
  props: RemoveAppDialogProps
) {
  const { open, onClose } = props;
  const { currentApp, removeApp, isRemoveAppMutating } = useApps();

  const handleConfirm = useCallback(async () => {
    await removeApp();
    onClose();
  }, [removeApp, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      panelClassName="flex flex-col space-y-8"
    >
      <div className="flex flex-col items-center space-y-6">
        <Illustration
          icon="warning-triangle"
          color="danger"
          className="w-auto p-5"
        />

        <div className="flex flex-col space-y-2 text-center">
          <span className="text-24 font-sora font-semibold">Delete app</span>

          <span className="text-14">
            Are you sure you want to delete your app
            <b>&nbsp;{currentApp?.app_metadata?.name}</b>?
          </span>
        </div>
      </div>

      <Button
        variant="danger"
        className="py-4.5 px-9"
        onClick={handleConfirm}
        disabled={isRemoveAppMutating}
      >
        Delete app
      </Button>

      <Button variant="plain" onClick={onClose}>
        Cancel
      </Button>
    </Dialog>
  );
});
