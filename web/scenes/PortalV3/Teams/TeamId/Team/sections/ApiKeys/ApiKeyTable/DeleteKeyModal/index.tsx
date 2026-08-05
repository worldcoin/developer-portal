import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
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
  const { isOpen, keyId, name, setIsOpen } = props;
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
    <DeleteConfirmationDialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      onConfirm={handleDelete}
      confirmationWord="Delete"
      loading={loading}
      title="Do you want to delete this API key?"
      description={
        <>
          The{" "}
          <span className="font-medium break-all text-grey-900">{name}</span>{" "}
          key will stop working immediately anywhere it is already deployed, and
          it cannot be recovered.
        </>
      }
    />
  );
};
