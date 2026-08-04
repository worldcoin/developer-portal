"use client";

import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { useMutation } from "@apollo/client/react";
import { atom, useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { FetchTeamMembersDocument } from "@/scenes/common/Teams/TeamId/Team/page/Members/graphql/client/fetch-team-members.generated";
import { RemoveUserDocument } from "@/scenes/common/Teams/TeamId/Team/page/Members/List/RemoveUserDialog/graphql/client/remove-user.generated";

export const removeUserDialogAtom = atom(false);

export const RemoveUserDialog = (props: {
  name: string;
  id: string | undefined | null;
}) => {
  const [isOpened, setIsOpened] = useAtom(removeUserDialogAtom);
  const { teamId } = useParams() as { teamId: string };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [removeUser] = useMutation(RemoveUserDocument);

  const submit = useCallback(async () => {
    if (!props.id || !teamId) {
      return toast.error("Something went wrong. Please try again later.");
    }

    setIsSubmitting(true);

    try {
      await removeUser({
        variables: {
          teamId,
          userId: props.id,
        },

        refetchQueries: [FetchTeamMembersDocument],
        awaitRefetchQueries: true,
      });

      toast.success(`User ${props.name} has been removed from the team.`);
    } catch (error) {
      return toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }

    setIsOpened(false);
  }, [props.id, props.name, removeUser, setIsOpened, teamId]);

  return (
    // No typed verification: the member can be invited back, unlike the deletes
    // that destroy data.
    <DeleteConfirmationDialog
      open={isOpened}
      onClose={() => setIsOpened(false)}
      onConfirm={submit}
      loading={isSubmitting}
      title="Remove member"
      description={
        <>
          <span className="font-medium text-portal-text">{props.name}</span>{" "}
          will lose access to this team and all of its apps. You can invite them
          again later.
        </>
      }
    />
  );
};
