"use client";
import { ActionDangerZone } from "@/components/ActionDangerZone";
import { ActionsHeader } from "@/components/ActionsHeader";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useRouter } from "next/navigation";
import { useCallback, use } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { useMutation, useQuery } from "@apollo/client/react";
import { GetActionsDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/page/graphql/client/actions.generated";
import { DeleteActionDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/ActionDangerZoneContent/graphql/client/delete-action.generated";
import { GetSingleActionDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/page/graphql/client/get-single-action.generated";

type ActionIdDangerPageProps = {
  params: Promise<Record<string, string>>;
};

export const ActionIdDangerPage = (props: ActionIdDangerPageProps) => {
  const params = use(props.params);
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const router = useRouter();

  const { data, loading } = useQuery(GetSingleActionDocument, {
    variables: { action_id: actionId ?? "" },
  });

  const action = data?.action_by_pk;

  const [deleteActionMutation, { loading: deleteActionLoading }] =
    useMutation(DeleteActionDocument);

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

      if (result.error) {
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
          // Danger-zone copy is static; only the action name and button wait on data.
          <div className="grid w-full max-w-[480px] gap-y-10">
            <div className="grid gap-y-2">
              <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
                Danger zone
              </Typography>
              <Skeleton count={2} height={12} />
            </div>

            <Skeleton width={180} height={56} className="rounded-full" />
          </div>
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
