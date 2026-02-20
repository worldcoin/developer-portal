"use client";
import { ActionDangerZone } from "@/components/ActionDangerZone";
import { ActionsHeader } from "@/components/ActionsHeader";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { useAtomValue } from "jotai";
import { worldId40Atom, isWorldId40Enabled } from "@/lib/feature-flags";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { GetActionsDocument } from "../../../page/graphql/client/actions.generated";
import { useDeleteActionMutation } from "../ActionDangerZoneContent/graphql/client/delete-action.generated";
import { useGetSingleActionQuery } from "./graphql/client/get-single-action.generated";

type ActionIdDangerPageProps = {
  params: Record<string, string> | null | undefined;
};

export const ActionIdDangerPage = ({ params }: ActionIdDangerPageProps) => {
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const router = useRouter();

  const { data, loading } = useGetSingleActionQuery({
    variables: { action_id: actionId ?? "" },
  });

  const action = data?.action_by_pk;
  const worldId40Config = useAtomValue(worldId40Atom);
  const isEnabled = isWorldId40Enabled(worldId40Config, teamId);

  const [deleteActionMutation, { loading: deleteActionLoading }] =
    useDeleteActionMutation();

  const handleDelete = useCallback(async () => {
    try {
      const result = await deleteActionMutation({
        variables: { id: action?.id ?? "" },
        refetchQueries: [
          {
            query: GetActionsDocument,
            variables: {
              app_id: appId,
              condition: {},
            },
            fetchPolicy: "network-only",
          },
        ],
        awaitRefetchQueries: true,
      });

      if (result.errors) {
        throw new Error("Failed to delete action");
      }

      toast.success(`${action?.name} was deleted.`);
      router.prefetch(`/teams/${teamId}/apps/${appId}/actions`);
      router.replace(`/teams/${teamId}/apps/${appId}/actions`);
    } catch (error) {
      throw error;
    }
  }, [action?.id, action?.name, appId, deleteActionMutation, router, teamId]);

  if (!loading && !action) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  } else {
    return (
      <SizingWrapper gridClassName="pt-6 pb-6 md:pb-10">
        {loading ? (
          <Skeleton height={150} />
        ) : (
          <ActionDangerZone
            actionIdentifier={action?.name ?? ""}
            onDelete={handleDelete}
            isDeleting={deleteActionLoading}
            canDelete={!isEnabled}
          />
        )}
      </SizingWrapper>
    );
  }
};
