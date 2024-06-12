import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { WarningErrorIcon } from "@/components/Icons/WarningErrorIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { toast } from "react-toastify";
import { FetchKeysDocument } from "../../graphql/client/fetch-keys.generated";
import { useDeleteKeyMutation } from "./graphql/client/delete-key.generated";

type DeleteKeyModalProps = {
  isOpen: boolean;
  teamId?: string;
  keyId?: string;
  name?: string;
  setIsOpen: (isOpen: boolean) => void;
};

export const DeleteKeyModal = (props: DeleteKeyModalProps) => {
  const { isOpen, teamId, keyId, name, setIsOpen } = props;
  const [deleteKeyMutation, { loading }] = useDeleteKeyMutation();

  const handleDelete = async () => {
    if (!keyId || loading) {
      return;
    }
    try {
      const result = await deleteKeyMutation({
        variables: {
          id: keyId,
        },
        refetchQueries: [FetchKeysDocument],
        awaitRefetchQueries: true,
      });
      if (result instanceof Error) {
        throw result;
      }
      setIsOpen(false);
      toast.success(`API key ${name} deleted successfully`);
    } catch (e) {
      console.error("Delete api key error: ", e);
      toast.error("An error occurred while deleting the API key");
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <DialogOverlay />

      <DialogPanel>
        <div className="grid grid-cols-1 justify-items-center gap-y-8 px-2 md:w-full md:max-w-[25rem]">
          <CircleIconContainer variant={"error"}>
            <WarningErrorIcon className="w-6" />
          </CircleIconContainer>

          <div className="grid w-full grid-cols-1 items-center justify-items-center gap-y-4 text-center">
            <Typography variant={TYPOGRAPHY.H6}>Are you sure?</Typography>

            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Are you sure you want to remove{" "}
              <div className="inline-flex">
                <Typography
                  variant={TYPOGRAPHY.M3}
                  className="max-w-52 truncate text-grey-900"
                >
                  {name}
                </Typography>
              </div>{" "}
              API key? Please be aware that this action is permanent.
            </Typography>
          </div>

          <div className="grid w-full gap-x-4 gap-y-2 md:grid-cols-2">
            <DecoratedButton
              className="order-2 md:order-1"
              type="button"
              variant="danger"
              onClick={handleDelete}
            >
              Delete Key
            </DecoratedButton>

            <DecoratedButton
              className="order-1 whitespace-nowrap"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Keep API Key
            </DecoratedButton>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
