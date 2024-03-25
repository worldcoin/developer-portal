"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { UserAddIcon } from "@/components/Icons/UserAddIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { atom, useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { useInviteTeamMembersMutation } from "../graphql/client/invite-team-members.generated";
import { EmailsInput } from "./EmailsInput";
import { FetchTeamMembersDocument } from "../graphql/client/fetch-team-members.generated";

export const inviteTeamMemberDialogAtom = atom(false);
export const emailsInputAtom = atom<string[]>([]);

export const InviteTeamMemberDialog = () => {
  const { teamId } = useParams() as { teamId: string };
  const [isOpened, setIsOpened] = useAtom(inviteTeamMemberDialogAtom);
  const [emails, setEmails] = useAtom(emailsInputAtom);

  const onClose = useCallback(() => {
    setIsOpened(false);
    setEmails([]);
  }, [setEmails, setIsOpened]);

  const [inviteTeamMembers, { loading }] = useInviteTeamMembersMutation();

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
    <Dialog open={isOpened} onClose={onClose}>
      <DialogOverlay />

      <DialogPanel className="grid justify-items-center gap-y-10 md:max-w-[36rem]">
        <div className="grid w-full justify-items-center gap-y-4">
          <CircleIconContainer variant="info">
            <UserAddIcon />
          </CircleIconContainer>

          <Typography
            as="h3"
            variant={TYPOGRAPHY.H6}
            className="mt-4 text-center"
          >
            Invite new team members
          </Typography>

          <Typography as="p" variant={TYPOGRAPHY.R3} className="text-center">
            Add multiple team members by separating them with a comma
          </Typography>
        </div>

        <EmailsInput
          placeholder="andy@example.com, lisa@example.com, etc."
          className="w-full"
        />

        <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 md:gap-4">
          <DecoratedButton
            className="order-2 md:order-1"
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </DecoratedButton>

          <DecoratedButton
            type="button"
            variant="primary"
            disabled={loading}
            onClick={handleInvite}
            className="order-1 whitespace-nowrap"
          >
            Send invite
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
