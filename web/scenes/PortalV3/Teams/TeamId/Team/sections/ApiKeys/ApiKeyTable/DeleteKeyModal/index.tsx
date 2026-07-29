import {
  FormDialog,
  formDialogDangerActionClassName,
  formDialogPrimaryActionClassName,
} from "@/components/FormDialog";
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
      title="Are you sure?"
      closeLabel="Close delete API key dialog"
    >
      <div className="grid gap-5">
        <p className="font-world text-13 leading-[1.5] text-portal-muted">
          Are you sure you want to remove{" "}
          <span className="font-medium text-portal-text">{name}</span> API key?
          Please be aware that this action is permanent.
        </p>

        <div className="grid w-full gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={handleDelete}
            className={`${formDialogDangerActionClassName} order-2 md:order-none`}
          >
            Delete Key
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
          >
            Keep API Key
          </button>
        </div>
      </div>
    </FormDialog>
  );
};
