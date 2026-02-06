"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { ActionDangerZone } from "@/components/ActionDangerZone";
import { ErrorPage } from "@/components/ErrorPage";
import { urls } from "@/lib/urls";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useGetSingleActionV4Query } from "../../page/graphql/client/get-single-action-v4.generated";
import { useDeleteActionV4Mutation } from "./graphql/client/delete-action-v4.generated";
import { GetActionsV4Document } from "../../../page/graphql/client/get-actions-v4.generated";
import { useUser } from "@auth0/nextjs-auth0/client";

type WorldIdActionIdDangerPageProps = {
  params: Record<string, string> | null | undefined;
};

export const WorldIdActionIdDangerPage = ({
  params,
}: WorldIdActionIdDangerPageProps) => {
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useUser() as Auth0SessionUser;

  const { data, loading } = useGetSingleActionV4Query({
    variables: { action_id: actionId ?? "" },
  });

  const [deleteActionMutation] = useDeleteActionV4Mutation({
    refetchQueries: [
      {
        query: GetActionsV4Document,
        variables: { app_id: appId ?? "" },
      },
    ],
    awaitRefetchQueries: true,
  });

  const action = data?.action_v4_by_pk;

  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === teamId,
    );

    return (
      membership?.role === Role_Enum.Owner ||
      membership?.role === Role_Enum.Admin
    );
  }, [teamId, user?.hasura.memberships]);

  const handleDelete = useCallback(async () => {
    if (!actionId || !appId || !teamId) return;

    setIsDeleting(true);

    try {
      await deleteActionMutation({
        variables: { id: actionId },
      });

      toast.success("Action deleted successfully");
      router.push(urls.worldIdActions({ team_id: teamId, app_id: appId }));
    } catch (error) {
      console.error("Failed to delete action:", error);
      toast.error("Failed to delete action");
      setIsDeleting(false);
    }
  }, [actionId, appId, teamId, deleteActionMutation, router]);

  if (!loading && !action) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  }

  return (
    <SizingWrapper gridClassName="order-1 pt-6 pb-6 md:pb-10">
      {loading ? (
        <div>Loading...</div>
      ) : action ? (
        <ActionDangerZone
          actionIdentifier={action.action}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          canDelete={isEnoughPermissions}
        />
      ) : null}
    </SizingWrapper>
  );
};
