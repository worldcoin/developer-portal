"use client";

import {
  FormDialog,
  formDialogPrimaryActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { atom, useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { useMutation } from "@apollo/client/react";
import { FetchTeamMembersDocument } from "@/scenes/common/Teams/TeamId/Team/page/Members/graphql/client/fetch-team-members.generated";
import { InviteTeamMembersDocument } from "@/scenes/common/Teams/TeamId/Team/page/Members/graphql/client/invite-team-members.generated";
import { EmailsInput } from "./EmailsInput";

export const inviteTeamMemberDialogAtom = atom(false);
export const emailsInputAtom = atom<string[]>([]);

export const InviteTeamMemberDialog = () => {
  const { teamId } = useParams() as { teamId: string };
  const [isOpened, setIsOpened] = useAtom(inviteTeamMemberDialogAtom);
  const [emails, setEmails] = useAtom(emailsInputAtom);

  const onClose = useCallback(() => {
    setIsOpened(false);
  }, [setIsOpened]);

  // Clear the chips only after the leave transition — clearing on close makes
  // them vanish while the dialog is still fading out.
  const afterLeave = useCallback(() => {
    setEmails([]);
  }, [setEmails]);

  const [inviteTeamMembers, { loading }] = useMutation(
    InviteTeamMembersDocument,
  );

  const handleInvite = useCallback(async () => {
    try {
      await inviteTeamMembers({
        variables: { emails, team_id: teamId },
        refetchQueries: [FetchTeamMembersDocument],
      });

      toast.success(`Invites are sent to ${emails.join(", ")}`);
    } catch (error) {
      return toast.error("Error inviting team members");
    }

    onClose();
  }, [emails, inviteTeamMembers, onClose, teamId]);

  return (
    <FormDialog
      open={isOpened}
      onClose={onClose}
      afterLeave={afterLeave}
      title="Invite new members"
      closeLabel="Close invite members dialog"
    >
      <div className="grid w-full gap-y-6">
        <p className="font-world text-14 leading-[1.5] text-portal-muted">
          Add multiple team members by separating them with a comma.
        </p>

        <EmailsInput
          placeholder="andy@example.com, lisa@example.com, etc."
          className="w-full"
        />

        <div className="grid w-full gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading || emails.length === 0}
            onClick={handleInvite}
            className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
          >
            {loading ? (
              <SpinnerIcon className="size-5 animate-spin" />
            ) : (
              "Send invite"
            )}
          </button>
        </div>
      </div>
    </FormDialog>
  );
};
