import { memo } from "react";
import { Illustration } from "src/components/Auth/Illustration";
import { Dialog } from "@/components/Dialog";
import { DialogHeader } from "@/components/DialogHeader";
import { IActionStore, useActionStore } from "src/stores/actionStore";
import { Button } from "src/components/Button";
import { useDeleteAction } from "../hooks/use-delete-action";

const getActionsStore = (store: IActionStore) => ({
  isOpened: store.isDeleteActionModalOpened,
  setIsOpened: store.setIsDeleteActionModalOpened,
  actionToDelete: store.actionToDelete,
});

export const DeleteAction = memo(function DeleteAction() {
  const { isOpened, setIsOpened, actionToDelete } =
    useActionStore(getActionsStore);

  const { deleteAction, loading } = useDeleteAction();

  return (
    <Dialog
      className="max-h-full overflow-y-auto lg:min-w-[486px]"
      open={isOpened}
      onClose={() => setIsOpened(false)}
    >
      <DialogHeader
        icon={<Illustration color="danger" icon="notepad" />}
        title={`Are you sure you want to delete "${
          actionToDelete?.name ?? "this"
        }" action? `}
        className="text-center"
      />

      <Button
        type="submit"
        variant="danger"
        className="w-full h-[56px] mt-12 text-base"
        disabled={loading}
        onClick={() => {
          deleteAction(actionToDelete?.id ?? "");
          setIsOpened(false);
        }}
      >
        Delete
      </Button>

      <Button
        type="button"
        variant="secondary"
        className="w-full h-[56px] mt-3 text-base"
        onClick={() => {
          setIsOpened(false);
        }}
      >
        Cancel
      </Button>
    </Dialog>
  );
});
