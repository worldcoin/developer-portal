import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { useLeaveTeamMutation } from "./graphql/client/leave-team.generated";

import {
  FetchMeDocument,
  FetchMeQuery,
} from "@/scenes/common/me-query/client/graphql/client/me-query.generated";

type LeaveTeamDialogProps = DialogProps & {
  team?: NonNullable<FetchMeQuery["user_by_pk"]>["memberships"][0]["team"];
};

export const LeaveTeamDialog = (props: LeaveTeamDialogProps) => {
  const { team, ...otherProps } = props;
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const [leaveTeam, leaveTeamMutationRes] = useLeaveTeamMutation();

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

      toast.success("Team leaved!");
      props.onClose(true);
    } catch (e) {
      console.error(e);
      toast.error("Error team leaving");
    }
  }, [props, leaveTeam, team, auth0User?.hasura]);

  if (!team) {
    return null;
  }

  return (
    <Dialog {...otherProps}>
      <DialogOverlay />

      <DialogPanel className="grid w-[28rem] gap-y-8">
        <CircleIconContainer variant="error">
          <AlertIcon />
        </CircleIconContainer>

        <div className="grid justify-items-center gap-y-4">
          <Typography as="h3" variant={TYPOGRAPHY.H6}>
            Are you sure?
          </Typography>

          <p className="text-center text-16 font-medium leading-6 text-grey-500">
            If you choose to leave the{" "}
            <span className="font-medium text-grey-900">{team?.name}</span>{" "}
            team, you will need to be invited again in order to rejoin if you
            change your mind.
          </p>
        </div>

        <div className="mt-2 grid w-full grid-cols-2 gap-x-4">
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
