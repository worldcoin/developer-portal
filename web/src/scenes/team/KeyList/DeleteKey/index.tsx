import { memo, useCallback } from "react";
import { Illustration } from "src/components/Auth/Illustration";
import { Dialog } from "@/components/Dialog";
import { DialogHeader } from "@/components/DialogHeader";
import { Button } from "src/components/Button";
import { IKeyStore, useKeyStore } from "src/stores/keyStore";
import useKeys from "src/hooks/useKeys";
import { toast } from "react-toastify";

const getKeyStore = (store: IKeyStore) => ({
  currentKey: store.currentKey,
  setCurrentKey: store.setCurrentKey,
  isOpened: store.isDeleteKeyModalOpened,
  setIsOpened: store.setIsDeleteKeyModalOpened,
});

export const DeleteKey = memo(function DeleteKey() {
  const { deleteKey, isLoading } = useKeys();
  const { currentKey, setCurrentKey, isOpened, setIsOpened } =
    useKeyStore(getKeyStore);

  const handleDeleteKey = useCallback(async () => {
    if (!currentKey?.id) {
      return toast.error("Something went wrong");
    }

    await deleteKey(currentKey.id);
    setIsOpened(false);
    setCurrentKey(null);
  }, [currentKey?.id, deleteKey, setCurrentKey, setIsOpened]);

  const close = useCallback(() => {
    setIsOpened(false);
    setCurrentKey(null);
  }, [setCurrentKey, setIsOpened]);

  return (
    <Dialog
      className="max-h-full overflow-y-auto lg:min-w-[486px]"
      open={isOpened}
      onClose={close}
    >
      <DialogHeader
        icon={<Illustration color="danger" icon="api" />}
        title={`Are you sure you want to delete the "${
          currentKey?.name ?? "this"
        }" key? `}
        className="text-center"
      />

      <Button
        type="submit"
        variant="danger"
        className="w-full h-[56px] mt-12 text-base"
        disabled={isLoading}
        onClick={handleDeleteKey}
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
