"use client";

import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DialogProps } from "@/components/Dialog";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { DeleteAccountDocument } from "@/scenes/common/Profile/DangerZone/DeleteAccountDialog/graphql/client/delete-account.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMutation } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

export const DeleteAccountDialog = (props: DialogProps) => {
  const { user } = useUser() as Auth0SessionUser;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onClose = useCallback(() => {
    props.onClose(false);
  }, [props]);

  const [deleteAccount] = useMutation(DeleteAccountDocument);

  const submit = useCallback(async () => {
    if (!user?.hasura) return;

    setIsSubmitting(true);

    try {
      await deleteAccount({
        variables: {
          user_id: user.hasura.id,
        },
      });
      toast.success("Account Deleted!");
      window.location.href = urls.api.authDeleteAccount();
    } catch (e) {
      console.error("Delete Account Dialog: ", e);
      toast.error("Error deleting account");
      setIsSubmitting(false);
    }
  }, [deleteAccount, user?.hasura]);

  return (
    <DeleteConfirmationDialog
      open={Boolean(props.open)}
      onClose={onClose}
      onConfirm={submit}
      confirmationWord="Delete"
      loading={isSubmitting}
      title="Do you want to delete this account?"
      description="Your account will be deleted, along with all apps and data. You will be removed from teams."
    />
  );
};
