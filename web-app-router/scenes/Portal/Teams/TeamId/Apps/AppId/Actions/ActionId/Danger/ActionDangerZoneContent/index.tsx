"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { Dialog } from "@/components/Dialog";
import { useCallback, useMemo, useState } from "react";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { useDeleteActionMutation } from "./graphql/client/delete-action.generated";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { GetActionsDocument } from "../../../page/graphql/client/actions.generated";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { GetSingleActionQuery } from "../page/graphql/client/get-single-action.generated";
import { Role_Enum } from "@/graphql/graphql";

export const ActionDangerZoneContent = (props: {
  action: GetSingleActionQuery["action"][0];
  teamId?: string;
}) => {
  const { action, teamId } = props;
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
    useDeleteActionMutation({});

  const deleteAction = useCallback(async () => {
    try {
      const result = await deleteActionQuery({
        variables: { id: action.id ?? "" },
        refetchQueries: [
          {
            query: GetActionsDocument,
            variables: { app_id: action.app_id },
          },
        ],
        awaitRefetchQueries: true,
      });
      if (result instanceof Error) {
        throw result;
      }
      router.replace(`..`);
    } catch (error) {
      console.error(error);
      return toast.error("Unable to delete action");
    }
    toast.success(`${action?.name} was deleted.`);
  }, [action.id, action?.name, action?.app_id, deleteActionQuery, router]);

  return (
    <div>
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <DialogOverlay />
        <DialogPanel className="rounded-x bg-white mx-auto w-5 grid gap-y-6">
          <CircleIconContainer variant={"error"}>
            <AlertIcon />
          </CircleIconContainer>
          <div className="grid place-items-center px-2 w-full gap-y-5">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              Are you sure?
            </Typography>
            <Typography
              variant={TYPOGRAPHY.R3}
              className="text-grey-500 text-center"
            >
              Are you sure you want to proceed with deleting this action? Please
              be aware that this action is irreversible, and all associated data
              will be permanently lost.
            </Typography>
          </div>
          <div className="grid grid-cols-2 gap-x-5">
            <DecoratedButton
              type="submit"
              variant="danger"
              className="w-full bg-system-error-100"
              onClick={deleteAction}
              disabled={deleteActionLoading}
            >
              <Typography variant={TYPOGRAPHY.R3}>Delete Action</Typography>
            </DecoratedButton>

            <DecoratedButton
              type="submit"
              className="w-full"
              onClick={() => setOpenDeleteModal(false)}
            >
              <Typography variant={TYPOGRAPHY.R3}>Keep Action</Typography>
            </DecoratedButton>
          </div>
        </DialogPanel>
      </Dialog>

      <div className="w-1/2 grid grid-cols-1 gap-y-10">
        <div className="grid gap-y-2">
          <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
            Danger Zone
          </Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            This will immediately and permanently delete <b>{action.name}</b>{" "}
            and its data for everyone. This cannot be undone.
          </Typography>
        </div>
        <DecoratedButton
          type="button"
          variant="danger"
          onClick={() => setOpenDeleteModal(true)}
          disabled={deleteActionLoading || !isEnoughPermissions}
          className="bg-system-error-100 w-40 "
        >
          <Typography variant={TYPOGRAPHY.R3}>Delete action</Typography>
        </DecoratedButton>
      </div>
    </div>
  );
};
