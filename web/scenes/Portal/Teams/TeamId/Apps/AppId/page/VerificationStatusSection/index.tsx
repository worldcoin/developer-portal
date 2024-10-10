"use client";
import { useMemo } from "react";
import { VerificationStatus } from "..";
import { ReviewStatus } from "../../../common/ReviewStatus";
import { useGetVerificationDataQuery } from "../graphql/client/get-verification-data.generated";

export const VerificationStatusSection = ({ appId }: { appId: string }) => {
  const { data } = useGetVerificationDataQuery({
    variables: {
      id: appId,
    },
  });

  const verificationStatus = useMemo(
    () =>
      data?.verificationStatus?.app_metadata?.[0]
        .verification_status as VerificationStatus,
    [data],
  );

  const verificationData = useMemo(
    () => data?.verificationData?.app_metadata?.[0],
    [data],
  );
  return (
    verificationData && (
      <ReviewStatus
        status={
          verificationData?.verification_status as
            | VerificationStatus.ChangesRequested
            | VerificationStatus.Verified
        }
        message={verificationData?.review_message ?? ""}
      />
    )
  );
};
