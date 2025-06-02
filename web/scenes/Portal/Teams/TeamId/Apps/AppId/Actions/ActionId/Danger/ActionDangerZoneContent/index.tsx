"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { truncateString } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { GetActionsDocument } from "../../../page/graphql/client/actions.generated";
import { GetSingleActionQuery } from "../page/graphql/client/get-single-action.generated";
import { useDeleteActionMutation } from "./graphql/client/delete-action.generated";

export const ActionDangerZoneContent = (props: {
  action: GetSingleActionQuery["action_by_pk"];
  teamId?: string;
  appId?: string;
}) => {
  const { action, appId, teamId } = props;
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const router = useRouter();
  const { user } = useUser() as Auth0SessionUser;

  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === teamId,
    );

    return (
      membership?.role === Role_Enum.Owner ||
      membership?.role === Role_Enum.Admin
    );
  }, [teamId, user?.hasura.memberships]);

  const [deleteActionQuery, { loading: deleteActionLoading }] =
    useDeleteActionMutation();

  const deleteAction = useCallback(async () => {
    try {
      const result = await deleteActionQuery({
        variables: { id: action?.id ?? "" },
        refetchQueries: [
          {
            query: GetActionsDocument,
            variables: {
              app_id: appId,
              condition: {},
            },
            fetchPolicy: "network-only", // No reason to pull cache as we deleted an action
          },
        ],
        awaitRefetchQueries: true,
      });

      if (result instanceof Error) {
        throw result;
      }
      router.prefetch(`/teams/${teamId}/apps/${appId}/actions`);
      router.replace(`/teams/${teamId}/apps/${appId}/actions`);
    } catch (error) {
      console.error("Delete Action: ", error);
      return toast.error("Unable to delete action");
    }

    toast.success(`${action?.name} was deleted.`);
  }, [action?.id, action?.name, appId, deleteActionQuery, router, teamId]);

  return (
    <div>
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <DialogOverlay />

        <DialogPanel className="grid gap-y-6 md:max-w-[26rem]">
          <CircleIconContainer variant={"error"}>
            <AlertIcon />
          </CircleIconContainer>

          <div className="grid w-full place-items-center gap-y-5 px-2">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              Are you sure?
            </Typography>

            <Typography
              variant={TYPOGRAPHY.R3}
              className="text-center text-grey-500"
            >
              Are you sure you want to proceed with deleting this action? Please
              be aware that this action is irreversible, and all associated data
              will be permanently lost.
            </Typography>
          </div>

          <div className="grid w-full gap-4 md:grid-cols-2">
            <DecoratedButton
              type="button"
              variant="danger"
              className="order-2 w-full bg-system-error-100 py-3 md:order-1"
              onClick={deleteAction}
              disabled={deleteActionLoading}
            >
              <Typography variant={TYPOGRAPHY.R3}>Delete Action</Typography>
            </DecoratedButton>

            <DecoratedButton
              type="button"
              className="order-1 w-full py-3 md:order-2"
              onClick={() => setOpenDeleteModal(false)}
            >
              <Typography variant={TYPOGRAPHY.R3}>Keep Action</Typography>
            </DecoratedButton>
          </div>
        </DialogPanel>
      </Dialog>

      <div className="grid w-full grid-cols-1 gap-y-10 md:grid-cols-1fr/auto">
        <div className="grid max-w-[480px] gap-y-10">
          <div className="grid gap-y-2">
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
              Danger Zone
            </Typography>

            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              This will immediately and permanently delete the action{" "}
              <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
                {truncateString(action?.name, 30)}
              </Typography>{" "}
              and its data for everyone. This cannot be undone.
            </Typography>
          </div>

          <DecoratedButton
            type="button"
            variant="danger"
            onClick={() => setOpenDeleteModal(true)}
            disabled={deleteActionLoading || !isEnoughPermissions}
            className="w-40 bg-system-error-100 "
          >
            <Typography variant={TYPOGRAPHY.R3}>Delete action</Typography>
          </DecoratedButton>
        </div>
      </div>
    </div>
  );
};
