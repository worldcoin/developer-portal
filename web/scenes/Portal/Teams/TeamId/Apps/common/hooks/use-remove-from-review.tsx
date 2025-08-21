import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { FetchAppMetadataDocument } from "../../AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { GetVerificationDataDocument } from "../../AppId/page/graphql/client/get-verification-data.generated";
import { updateAppVerificationStatus } from "./server";

export const useRemoveFromReview = (props: {
  metadataId: string | undefined;
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
    if (loading || !props.metadataId) {
      return;
    }

    setLoading(true);

    const result = await updateAppVerificationStatus(
      props.metadataId,
      "unverified",
    );

    if (result.success) {
      await Promise.all([refetchAppMetadata(), refetchVerificationData()]);
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  }, [loading, props.metadataId, refetchAppMetadata, refetchVerificationData]);

  return { removeFromReview, loading };
};
