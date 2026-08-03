"use client";

import { ActionDangerZone } from "@/components/ActionDangerZone";
import { DangerZoneCard } from "@/components/DangerZoneCard";
import { urls } from "@/lib/urls";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import { useApolloClient } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { GetWorldIdActionDetailQuery } from "../graphql/client/get-world-id-action-detail.generated";
import { deleteActionV4ServerSide } from "./server";

type Action = Pick<
  GetWorldIdActionDetailQuery["action_v4"][number],
  "id" | "action"
>;

export const DeleteAction = (props: {
  action: Action;
  teamId: string;
  appId: string;
  canModify: boolean;
  onDeleted?: () => void;
}) => {
  const { action, teamId, appId, canModify, onDeleted } = props;
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
      router.push(
        urls.worldIdTab({
          team_id: teamId,
          app_id: appId,
          tab: WORLD_ID_TABS.Actions,
        }),
      );
    } finally {
      setIsDeleting(false);
    }
  }, [action.id, appId, teamId, router, apolloClient, onDeleted]);

  return (
    <DangerZoneCard
      title="Delete this action"
      name={action.action}
      variant="compact"
      footerAction={
        <ActionDangerZone
          actionIdentifier={action.action}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          canDelete={canModify}
          compact
        />
      }
    />
  );
};
