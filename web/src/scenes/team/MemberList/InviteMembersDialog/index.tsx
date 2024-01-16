import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { DialogHeader } from "@/components/DialogHeader";
import { FieldLabel } from "@/components/FieldLabel";
import { Button } from "@/components/Button";
import { EmailsInput } from "./EmailsInput";
import { Icon } from "@/components/Icon";
import cn from "classnames";
import { DialogHeaderIcon } from "@/components/DialogHeaderIcon";
import { useInviteTeamMembersMutation } from "@/scenes/team/graphql/inviteTeamMembers.generated";
import { TeamsDocument } from "@/scenes/team/graphql/teams.generated";
import { toast } from "react-toastify";
import posthog from "posthog-js";
import { useRouter } from "next/router";

export const InviteMembersDialog = memo(function InviteMembersDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const { onClose } = props;
  const router = useRouter();

  const team_id = useMemo(
    () => router.query.team_id as string,
    [router.query.team_id]
  );

  const [inviteTeamMembers, { loading, called, reset, error }] =
    useInviteTeamMembersMutation({
      context: { headers: { team_id: team_id } },

      refetchQueries: [
        { query: TeamsDocument, context: { headers: { team_id: team_id } } },
      ],

      onCompleted: (data) => {
        if (!data) {
          return;
        }

        toast.success("Members invited");
        posthog.capture("teammate_invite_success");
        reset();
        onClose();
      },

      onError: () => {
        toast.error("Cannot invite members, please try again");
        posthog.capture("teammate_invite_failed", { error: error });
      },
    });

  const [emails, setEmails] = useState<string[]>([]);

  const handleSubmit = useCallback(async () => {
    await inviteTeamMembers({ variables: { emails } });
  }, [inviteTeamMembers, emails]);

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogHeader
        icon={<DialogHeaderIcon icon="user-add" />}
        title="Invite New Members"
      />

      <div>
        <div className="flex flex-col gap-y-2">
          <FieldLabel required>Invite by email</FieldLabel>

          <EmailsInput
            placeholder="Email, comma separates invite"
            disabled={loading}
            value={emails}
            onChange={setEmails}
          />
        </div>

        <Button
          className={cn("w-full gap-x-4 h-[56px] mt-12 font-medium", {
            "!text-accents-success-700 !bg-accents-success-300":
              called && !error && !loading,
          })}
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading && (
            <>
              <Icon name="spinner" className="h-5 w-5" />
              Sending
            </>
          )}

          {!loading && called && !error && (
            <>
              <Icon name="check" className="h-5 w-5" />
              Invite sent
            </>
          )}

          {((!loading && !called) || error) && "Send invite"}
        </Button>
      </div>
    </Dialog>
  );
});
