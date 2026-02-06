"use client";
import { ErrorPage } from "@/components/ErrorPage";
import Skeleton from "react-loading-skeleton";
import { ActionsHeader } from "@/components/ActionsHeader";
import { ActionDangerZone } from "@/components/ActionDangerZone";
import { useGetSingleActionQuery } from "./graphql/client/get-single-action.generated";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { useDeleteActionMutation } from "../ActionDangerZoneContent/graphql/client/delete-action.generated";
import { GetActionsDocument } from "../../../page/graphql/client/actions.generated";

type ActionIdDangerPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
  isReadOnly?: boolean;
};

export const ActionIdDangerPage = ({
  params,
  isReadOnly,
}: ActionIdDangerPageProps) => {
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const router = useRouter();

  const { data, loading } = useGetSingleActionQuery({
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

      if (result instanceof Error) {
        throw result;
      }

      toast.success(`${action?.name} was deleted.`);
      router.prefetch(`/teams/${teamId}/apps/${appId}/actions`);
      router.replace(`/teams/${teamId}/apps/${appId}/actions`);
    } catch (error) {
      console.error("Delete Action: ", error);
      toast.error("Unable to delete action");
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
      <>
        <SizingWrapper gridClassName="order-1 pt-6 md:pt-10">
          <ActionsHeader
            displayText={action?.name ?? ""}
            backText={
              isReadOnly
                ? "Back to Legacy Actions"
                : "Back to Incognito Actions"
            }
            backUrl={urls.actions({ team_id: teamId ?? "", app_id: appId })}
            isLoading={loading}
            analyticsContext={{
              teamId,
              appId,
              actionId,
              location: "actions",
            }}
          />

          <hr className="mt-5 w-full border-dashed text-grey-200" />
        </SizingWrapper>

        <SizingWrapper gridClassName="order-2 pt-2 pb-6 md:pb-10">
          {loading ? (
            <Skeleton height={150} />
          ) : (
            <ActionDangerZone
              actionIdentifier={action?.name ?? ""}
              onDelete={handleDelete}
              isDeleting={deleteActionLoading}
              canDelete={!isReadOnly}
            />
          )}
        </SizingWrapper>
      </>
    );
  }
};
