import { memo } from "react";
import { Illustration } from "src/components/Auth/Illustration";
import { Dialog } from "@/components/Dialog";
import { DialogHeader } from "@/components/DialogHeader";
import { Button } from "src/components/Button";
import { IKeyStore, useKeyStore } from "src/stores/keyStore";
import useKeys from "src/hooks/useKeys";

const getKeyStore = (store: IKeyStore) => ({
  currentKey: store.currentKey,
  isOpened: store.isDeleteKeyModalOpened,
  setIsOpened: store.setIsDeleteKeyModalOpened,
});

export const DeleteKey = memo(function DeleteKey() {
  const { currentKey, deleteKey, isLoading } = useKeys();
  const { isOpened, setIsOpened } = useKeyStore(getKeyStore);

  return (
    <Dialog
      className="max-h-full overflow-y-auto lg:min-w-[486px]"
      open={isOpened}
      onClose={() => setIsOpened(false)}
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
        onClick={() => {
          deleteKey();
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
