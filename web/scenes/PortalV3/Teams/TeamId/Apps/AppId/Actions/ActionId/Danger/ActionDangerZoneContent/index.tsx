"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { truncateString } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useMutation } from "@apollo/client/react";
import { GetActionsDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/page/graphql/client/actions.generated";
import { urls } from "@/lib/urls";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import { GetSingleActionQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/page/graphql/client/get-single-action.generated";
import { DeleteActionDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/ActionDangerZoneContent/graphql/client/delete-action.generated";

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
    useMutation(DeleteActionDocument);

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
      const legacyActionsUrl = urls.worldIdTab({
        team_id: teamId ?? "",
        app_id: appId ?? "",
        tab: WORLD_ID_TABS.LegacyActions,
      });
      router.prefetch(legacyActionsUrl);
      router.replace(legacyActionsUrl);
    } catch (error) {
      console.error("Delete Action: ", error);
      return toast.error("Unable to delete action");
    }

    toast.success(`${action?.name} was deleted.`);
  }, [action?.id, action?.name, appId, deleteActionQuery, router, teamId]);

  return (
    <div>
      <DeleteConfirmationDialog
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={deleteAction}
        confirmationWord="Delete"
        loading={deleteActionLoading}
        title="Do you want to delete this action?"
        description={
          <>
            The{" "}
            <span className="font-medium break-all text-grey-900">
              {action?.name}
            </span>{" "}
            action and all of its data will be deleted for everyone.
          </>
        }
      />

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
            className="w-40 bg-system-error-100"
          >
            <Typography variant={TYPOGRAPHY.R3}>Delete action</Typography>
          </DecoratedButton>
        </div>
      </div>
    </div>
  );
};
