import { CircleIconContainer } from "@/components/CircleIconContainer";
import {
  FormDialog,
  formDialogDangerActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { WarningErrorIcon } from "@/components/Icons/WarningErrorIcon";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import { FetchKeysDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated";
import { DeleteKeyDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/ApiKeyTable/DeleteKeyModal/graphql/client/delete-key.generated";

type DeleteKeyModalProps = {
  isOpen: boolean;
  teamId?: string;
  keyId?: string;
  name?: string;
  setIsOpen: (isOpen: boolean) => void;
};

export const DeleteKeyModal = (props: DeleteKeyModalProps) => {
  const { isOpen, teamId, keyId, name, setIsOpen } = props;
  const [deleteKeyMutation, { loading }] = useMutation(DeleteKeyDocument);

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
    <FormDialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      dismissable={!loading}
      title="Remove API key"
      closeLabel="Close remove API key dialog"
    >
      <div className="grid w-full gap-y-6">
        <div className="grid justify-items-center gap-y-4">
          <CircleIconContainer variant={"error"}>
            <WarningErrorIcon className="w-6" />
          </CircleIconContainer>

          <p className="text-center font-world text-14 leading-[1.5] text-portal-muted">
            Are you sure you want to remove{" "}
            <span className="font-medium break-all text-portal-text">
              {name}
            </span>{" "}
            API key? Please be aware that this action is permanent.
          </p>
        </div>

        <div className="grid w-full gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={loading}
            className={formDialogSecondaryActionClassName}
          >
            Keep API Key
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className={formDialogDangerActionClassName}
          >
            Delete Key
          </button>
        </div>
      </div>
    </FormDialog>
  );
};
