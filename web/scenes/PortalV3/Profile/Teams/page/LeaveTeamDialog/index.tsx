import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DialogProps } from "@/components/Dialog";
import { Auth0SessionUser } from "@/lib/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { useMutation } from "@apollo/client/react";
import { LeaveTeamDocument } from "@/scenes/common/Profile/Teams/page/LeaveTeamDialog/graphql/client/leave-team.generated";

import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";

type LeaveTeamDialogProps = DialogProps & {
  team?: { id: string; name?: string | null };
};

export const LeaveTeamDialog = (props: LeaveTeamDialogProps) => {
  const { team } = props;
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const [leaveTeam, leaveTeamMutationRes] = useMutation(LeaveTeamDocument);

  const submit = useCallback(async () => {
    if (!team || !auth0User?.hasura) {
      return;
    }

    try {
      await leaveTeam({
        variables: {
          user_id: auth0User.hasura.id,
          team_id: team?.id,
        },

        refetchQueries: [FetchMeDocument],
      });

      toast.success("You left the team");
      props.onClose(true);
    } catch (e) {
      console.error("Leave Team Dialog: ", e);
      toast.error("Error leaving team");
    }
  }, [props, leaveTeam, team, auth0User?.hasura]);

  if (!team) {
    return null;
  }

  return (
    // No typed verification: an invite can bring the user back, unlike the
    // deletes that destroy data.
    <DeleteConfirmationDialog
      open={Boolean(props.open)}
      onClose={() => props.onClose(false)}
      onConfirm={submit}
      loading={leaveTeamMutationRes.loading}
      title="Do you want to leave this team?"
      description={
        <>
          You will lose access to the{" "}
          <span className="font-medium text-grey-900">{team?.name}</span> team
          and will need to be invited again in order to rejoin.
        </>
      }
    />
  );
};
