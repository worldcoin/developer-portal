"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { atom, useAtom } from "jotai";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useRemoveUserMutation } from "./graphql/client/remove-user.generated";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { FetchMembershipsDocument } from "../graphql/client/fetch-members.generated";

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

  const [removeUser] = useRemoveUserMutation({
    context: { headers: { team_id: teamId } },
  });

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

        refetchQueries: [FetchMembershipsDocument],
        awaitRefetchQueries: true,
      });

      toast.success(`User ${props.name} has been removed from the team.`);
    } catch (error) {
      return toast.error("Something went wrong. Please try again later.");
    }

    setIsOpened(false);
  }, [props.id, props.name, removeUser, setIsOpened, teamId]);

  return (
    <Dialog open={isOpened} onClose={setIsOpened}>
      <DialogOverlay />

      <DialogPanel className="grid gap-y-8 max-w-[400px]">
        <CircleIconContainer variant="error">
          <AlertIcon />
        </CircleIconContainer>

        <div className="grid gap-y-4 justify-items-center">
          <Typography variant={TYPOGRAPHY.H6}>Are you sure?</Typography>

          <p className="text-center text-grey-500">
            Are you sure you want to remove{" "}
            <span className="text-grey-900 font-medium">{props.name}</span> as a
            member of your team? Please be aware that this action is permanent.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(submit)}
          className="grid grid-cols-2 items-center gap-x-4 w-full"
        >
          <DecoratedButton
            type="submit"
            variant="danger"
            disabled={isSubmitting}
          >
            Remove
          </DecoratedButton>

          <DecoratedButton
            variant="primary"
            type="button"
            onClick={() => setIsOpened(false)}
          >
            Keep member
          </DecoratedButton>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
