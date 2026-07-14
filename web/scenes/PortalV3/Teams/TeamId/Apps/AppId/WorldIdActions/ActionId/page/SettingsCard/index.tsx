"use client";

import { ActionDangerZone } from "@/components/ActionDangerZone";
import { urls } from "@/lib/urls";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { deleteActionV4ServerSide } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Danger/page/server";
import { UpdateActionV4Form } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/UpdateActionV4Form";
import { GetActionVerificationsFeedQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/Actions/ActionId/page/graphql/client/get-action-verifications.generated";
import { useApolloClient } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

type Action = GetActionVerificationsFeedQuery["action_v4"][number];

export const SettingsCard = (props: {
  action: Action;
  teamId: string;
  appId: string;
  canDelete: boolean;
  onDeleted?: () => void;
  onUpdated?: () => void;
}) => {
  const { action, teamId, appId, canDelete, onDeleted, onUpdated } = props;
  const router = useRouter();
  const apolloClient = useApolloClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const result = await deleteActionV4ServerSide(action.id, appId);
      if (!result.success) {
        throw new Error(result.message || "Failed to delete action");
      }
      onDeleted?.();
      const cacheId = apolloClient.cache.identify({
        __typename: "action_v4",
        id: action.id,
      });
      if (cacheId) {
        apolloClient.cache.evict({ id: cacheId });
      }
      apolloClient.cache.gc();
      toast.success("Action deleted successfully");
      router.push(urls.worldId({ team_id: teamId, app_id: appId }));
    } finally {
      setIsDeleting(false);
    }
  }, [action.id, appId, teamId, router, apolloClient, onDeleted]);

  return (
    <details className="group flex flex-col overflow-hidden rounded-16 border border-portal-border bg-white shadow-portal-card">
      <summary className="flex cursor-pointer items-center gap-2.5 px-4 py-3.5 select-none">
        <Icon
          name="chevron-down"
          className="size-3 -rotate-90 text-portal-muted transition-transform group-open:rotate-0"
        />
        <span className="font-world text-sm font-medium text-portal-heading">
          Settings
        </span>
      </summary>
      <div className="flex flex-col gap-8 border-t border-portal-border p-4 pt-6">
        <UpdateActionV4Form
          action={action}
          appId={appId}
          onUpdated={onUpdated}
        />
        {canDelete ? (
          <div className="border-t border-portal-border pt-6">
            <ActionDangerZone
              actionIdentifier={action.action}
              onDelete={handleDelete}
              isDeleting={isDeleting}
              canDelete
            />
          </div>
        ) : null}
      </div>
    </details>
  );
};
