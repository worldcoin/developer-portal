"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { ActionDangerZone } from "@/components/ActionDangerZone";
import { ErrorPage } from "@/components/ErrorPage";
import { urls } from "@/lib/urls";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useGetSingleActionV4Query } from "../../page/graphql/client/get-single-action-v4.generated";
import { deleteActionV4ServerSide } from "./server";

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

  const { data, loading, error } = useGetSingleActionV4Query({
    variables: { action_id: actionId ?? "" },
  });

  const action = data?.action_v4_by_pk;

  const handleDelete = useCallback(async () => {
    if (!actionId || !appId || !teamId) return;

    setIsDeleting(true);
    try {
      const result = await deleteActionV4ServerSide(actionId, appId);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Action deleted successfully");
      router.push(urls.worldIdActions({ team_id: teamId, app_id: appId }));
    } catch (error) {
      toast.error("Failed to delete action");
    } finally {
      setIsDeleting(false);
    }
  }, [actionId, appId, teamId, router]);

  if (error) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={500} title="Failed to load action" />
      </SizingWrapper>
    );
  }

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
      ) : (
        <ActionDangerZone
          actionIdentifier={action!.action}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          canDelete={true}
        />
      )}
    </SizingWrapper>
  );
};
