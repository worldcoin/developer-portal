"use client";

import {
  FormDialog,
  formDialogDangerActionClassName,
  formDialogPrimaryActionClassName,
} from "@/components/FormDialog";
import { useMutation } from "@apollo/client/react";
import { atom, useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
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

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const [removeUser] = useMutation(RemoveUserDocument);

  const submit = useCallback(async () => {
    if (!props.id || !teamId) {
      return toast.error("Something went wrong. Please try again later.");
    }

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
    }

    setIsOpened(false);
  }, [props.id, props.name, removeUser, setIsOpened, teamId]);

  return (
    <FormDialog
      open={isOpened}
      onClose={() => setIsOpened(false)}
      title="Are you sure?"
      closeLabel="Close remove member dialog"
    >
      <div className="grid gap-5">
        <p className="font-world text-13 leading-[1.5] text-portal-muted">
          Are you sure you want to remove{" "}
          <span className="font-medium text-portal-text">{props.name}</span> as
          a member of your team? Please be aware that this action is permanent.
        </p>

        <form
          onSubmit={handleSubmit(submit)}
          className="grid w-full gap-3 md:grid-cols-2"
        >
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${formDialogDangerActionClassName} order-2 md:order-none`}
          >
            Remove
          </button>

          <button
            type="button"
            onClick={() => setIsOpened(false)}
            className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
          >
            Keep member
          </button>
        </form>
      </div>
    </FormDialog>
  );
};
