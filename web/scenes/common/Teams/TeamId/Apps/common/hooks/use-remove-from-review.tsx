import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { GetVerificationDataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/page/graphql/client/get-verification-data.generated";
import { removeAppFromReview } from "./server";

export const useRemoveFromReview = (props: {
  metadataId: string | undefined;
  metadataUpdatedAt: string | undefined;
  verificationStatus: string | undefined;
}) => {
  const { appId } = useParams() as { appId: string };
  const [loading, setLoading] = useState(false);

  const { refetch: refetchAppMetadata } = useRefetchQueries(
    FetchAppMetadataDocument,
    { id: appId },
  );

  const { refetch: refetchVerificationData } = useRefetchQueries(
    GetVerificationDataDocument,
    { id: appId },
  );

  const removeFromReview = useCallback(async () => {
    if (
      loading ||
      !props.metadataId ||
      !props.metadataUpdatedAt ||
      !["awaiting_review", "changes_requested"].includes(
        props.verificationStatus ?? "",
      )
    ) {
      return;
    }

    setLoading(true);

    const result = await removeAppFromReview(props.metadataId, {
      expectedVerificationStatus: props.verificationStatus as
        | "awaiting_review"
        | "changes_requested",
      expectedMetadataUpdatedAt: props.metadataUpdatedAt,
    });

    if (result.success) {
      await Promise.all([refetchAppMetadata(), refetchVerificationData()]);
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  }, [
    loading,
    props.metadataId,
    props.metadataUpdatedAt,
    props.verificationStatus,
    refetchAppMetadata,
    refetchVerificationData,
  ]);

  return { removeFromReview, loading };
};
