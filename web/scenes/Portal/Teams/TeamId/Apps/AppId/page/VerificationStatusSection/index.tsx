"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { urls } from "@/lib/urls";
import { VerificationStatus } from "..";
import { ReviewStatus } from "../../../common/ReviewStatus";
import { ResolveModal } from "../../Configuration/ResolveModal";
import { useGetVerificationDataQuery } from "../graphql/client/get-verification-data.generated";

export const VerificationStatusSection = ({
  appId,
  teamId,
}: {
  appId: string;
  teamId: string;
}) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const { data } = useGetVerificationDataQuery({
    variables: {
      id: appId,
    },
  });

  const verificationData = data?.app?.app_metadata?.[0];

  if (!verificationData) return null;

  return (
    <>
      <ReviewStatus
        status={
          verificationData.verification_status as
            | VerificationStatus.ChangesRequested
            | VerificationStatus.Verified
        }
        message={verificationData.review_message ?? ""}
        onResolveClick={() => setShowModal(true)}
      />
      <ResolveModal
        open={showModal}
        setOpen={setShowModal}
        reviewMessage={verificationData.review_message}
        onResolve={() =>
          router.push(urls.configuration({ team_id: teamId, app_id: appId }))
        }
      />
    </>
  );
};
