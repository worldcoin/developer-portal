import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { WarningErrorIcon } from "@/components/Icons/WarningErrorIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useDeleteKeyMutation } from "./graphql/client/delete-key.generated";
import { FetchKeysDocument } from "../../graphql/client/fetch-keys.generated";
import { toast } from "react-toastify";

type DeleteKeyModalProps = {
  isOpen: boolean;
  teamId?: string;
  keyId?: string;
  name?: string;
  setIsOpen: (isOpen: boolean) => void;
};

export const DeleteKeyModal = (props: DeleteKeyModalProps) => {
  const { isOpen, teamId, keyId, name, setIsOpen } = props;
  const [deleteKeyMutation, { loading }] = useDeleteKeyMutation({
    context: { headers: { team_id: teamId } },
  });

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
      console.error(e);
      toast.error("An error occurred while deleting the API key");
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="w-full">
      <DialogOverlay />
      <DialogPanel>
        <div className="max-w-[400px] px-2 grid grid-cols-1 gap-y-8 justify-items-center w-full">
          <CircleIconContainer variant={"error"}>
            <WarningErrorIcon className="w-6" />
          </CircleIconContainer>
          <div className="grid grid-cols-1 w-full items-center justify-items-center gap-y-4 text-center">
            <Typography variant={TYPOGRAPHY.H6}>Are you sure?</Typography>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Are you sure you want to remove{" "}
              <div className="inline-flex">
                <Typography
                  variant={TYPOGRAPHY.M3}
                  className="text-grey-900 max-w-52 truncate"
                >
                  {name}
                </Typography>
              </div>{" "}
              API key? Please be aware that this action is permanent.
            </Typography>
          </div>
          <div className="grid grid-cols-2 w-full gap-x-3">
            <DecoratedButton
              type="button"
              variant="danger"
              onClick={handleDelete}
            >
              Delete Key
            </DecoratedButton>
            <DecoratedButton type="button" onClick={() => setIsOpen(false)}>
              Keep API Key
            </DecoratedButton>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
