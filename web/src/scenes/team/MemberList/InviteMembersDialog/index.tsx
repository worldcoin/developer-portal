import { memo, useCallback, useState } from "react";
import { Dialog } from "@/components/Dialog2";
import { Button } from "@/components/Button2";
import { EmailsInput } from "./EmailsInput";
import { Icon } from "@/components/Icon";
import { useInviteTeamMembersMutation } from "@/scenes/team/graphql/inviteTeamMembers.generated";
import { TeamsDocument } from "@/scenes/team/graphql/teams.generated";
import { toast } from "react-toastify";
import posthog from "posthog-js";

export const InviteMembersDialog = memo(function InviteMembersDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const { onClose } = props;

  const [inviteTeamMembers, { loading, called, reset, error }] =
    useInviteTeamMembersMutation({
      refetchQueries: [{ query: TeamsDocument }],

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
      <div className="leading-7 font-medium text-20 text-gray-900">
        Invite member
      </div>

      <div className="mt-2 leading-5 text-14 text-gray-500">
        Add multiple team members by separating them with a comma.
      </div>

      <EmailsInput
        className="mt-5"
        placeholder="Email address"
        disabled={loading}
        value={emails}
        onChange={setEmails}
      />

      <div className="grid grid-cols-2 items-center space-x-3 mt-7">
        <Button
          variant="contained"
          color={!loading && called && !error ? "success" : undefined}
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading && (
            <>
              <Icon name="spinner2" className="h-5 w-5 animate-spin" />
              Sending
            </>
          )}

          {!loading && called && !error && (
            <>
              <Icon name="check2" className="h-5 w-5" />
              Invite sent
            </>
          )}

          {((!loading && !called) || error) && "Send invite"}
        </Button>

        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
});
