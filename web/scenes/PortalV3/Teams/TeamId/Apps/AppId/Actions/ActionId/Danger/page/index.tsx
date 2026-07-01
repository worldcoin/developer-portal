"use client";
import { ActionDangerZone } from "@/components/ActionDangerZone";
import { ActionsHeader } from "@/components/ActionsHeader";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { useRouter } from "next/navigation";
import { useCallback, use } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { GetActionsDocument } from "@/scenes/common/actions/graphql/client/actions.generated";
import { useDeleteActionMutation } from "@/scenes/common/actions/graphql/client/delete-action.generated";
import { useGetSingleActionForDangerQuery } from "@/scenes/common/actions/graphql/client/get-single-action-for-danger.generated";

type ActionIdDangerPageProps = {
  params: Promise<Record<string, string>>;
};

export const ActionIdDangerPage = (props: ActionIdDangerPageProps) => {
  const params = use(props.params);
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const router = useRouter();

  const { data, loading } = useGetSingleActionForDangerQuery({
    variables: { action_id: actionId ?? "" },
  });

  const action = data?.action_by_pk;

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
            canDelete={false}
          />
        )}
      </SizingWrapper>
    );
  }
};
