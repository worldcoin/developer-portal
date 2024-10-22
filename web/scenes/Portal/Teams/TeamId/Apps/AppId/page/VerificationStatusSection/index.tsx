"use client";
import { VerificationStatus } from "..";
import { ReviewStatus } from "../../../common/ReviewStatus";
import { useGetVerificationDataQuery } from "../graphql/client/get-verification-data.generated";

export const VerificationStatusSection = ({ appId }: { appId: string }) => {
  const { data } = useGetVerificationDataQuery({
    variables: {
      id: appId,
    },
  });

  const verificationData = data?.app?.app_metadata?.[0];

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
