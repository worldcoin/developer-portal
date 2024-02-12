import { useCallback } from "react";
import { FetchAppMetadataDocument } from "../../AppId/Profile/graphql/client/fetch-app-metadata.generated";
import { useUpdateAppVerificationStatusMutation } from "./graphql/client/update-app-verification-status.generated";
import { useParams } from "next/navigation";
import { GetVerificationDataDocument } from "../../AppId/page/graphql/client/get-verification-data.generated";

export const useRemoveFromReview = (props: { metadataId: string }) => {
  const { teamId, appId } = useParams() as { teamId: string; appId: string };

  const [updateAppVerificationStatusMutation, { loading }] =
    useUpdateAppVerificationStatusMutation();

  const removeFromReview = useCallback(async () => {
    if (loading) {
      return;
    }

    const appMetadataId = props.metadataId;

    await updateAppVerificationStatusMutation({
      variables: {
        app_metadata_id: appMetadataId,
        verification_status: "unverified",
      },
      context: { headers: { team_id: teamId } },
      refetchQueries: [FetchAppMetadataDocument, GetVerificationDataDocument],
      awaitRefetchQueries: true,
    });
  }, [loading, props.metadataId, updateAppVerificationStatusMutation, teamId]);

  return { removeFromReview, loading };
};
