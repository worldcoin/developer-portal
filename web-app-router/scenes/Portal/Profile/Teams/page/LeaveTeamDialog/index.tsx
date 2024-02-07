import { useCallback } from "react";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { DialogOverlay } from "@/components/DialogOverlay";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import {
  FetchMembershipsDocument,
  FetchMembershipsQuery,
} from "../graphql/client/fetch-memberships.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { useLeaveTeamMutation } from "./graphql/client/leave-team.generated";
import { toast } from "react-toastify";

type LeaveTeamDialogProps = DialogProps & {
  team?: FetchMembershipsQuery["memberships"][0]["team"];
};

export const LeaveTeamDialog = (props: LeaveTeamDialogProps) => {
  const { team, ...otherProps } = props;

  const { user } = useUser() as Auth0SessionUser;

  const [leaveTeam, leaveTeamMutationRes] = useLeaveTeamMutation({
    context: { headers: { team_id: team?.id } },
  });

  const submit = useCallback(async () => {
    if (!team || !user?.hasura) return;
    try {
      await leaveTeam({
        variables: {
          user_id: user.hasura.id,
          team_id: team?.id,
        },
        refetchQueries: [FetchMembershipsDocument],
      });
      toast.success("Team leaved!");
      props.onClose(true);
    } catch (e) {
      console.error(e);
      toast.error("Error team leaving");
    }
  }, [props, leaveTeam, team, user?.hasura]);

  if (!team) {
    return null;
  }

  return (
    <Dialog {...otherProps}>
      <DialogOverlay />

      <DialogPanel className="w-[28rem] grid gap-y-8">
        <CircleIconContainer variant="error">
          <AlertIcon />
        </CircleIconContainer>

        <div className="grid justify-items-center gap-y-4">
          <Typography as="h3" variant={TYPOGRAPHY.H6}>
            Are you sure?
          </Typography>

          <p className="leading-6 font-500 text-16 text-center text-grey-500">
            If you choose to leave the{" "}
            <span className="font-medium text-grey-900">{team?.name}</span>{" "}
            team, you will need to be invited again in order to rejoin if you
            change your mind.
          </p>
        </div>

        <div className="grid grid-cols-2 w-full gap-x-4 mt-2">
          <DecoratedButton
            type="button"
            variant="danger"
            onClick={submit}
            loading={leaveTeamMutationRes.loading}
          >
            Leave team
          </DecoratedButton>

          <DecoratedButton
            type="button"
            variant="primary"
            onClick={() => props.onClose(false)}
          >
            Stay in team
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
