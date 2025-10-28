"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SuccessIcon } from "@/components/Icons/SuccessIcon";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { useParams, useRouter } from "next/navigation";

export const WithdrawSuccess = () => {
  const { teamId } = useParams() as { teamId: string | undefined };
  const router = useRouter();

  return (
    <div className="grid w-full place-items-center justify-self-center py-8 md:max-w-[380px]">
      <CircleIconContainer variant="success">
        <SuccessIcon />
      </CircleIconContainer>

      <Typography variant={TYPOGRAPHY.H5} className="mt-8">
        Withdrawal processing
      </Typography>

      <Typography variant={TYPOGRAPHY.R4} className="mt-3 text-gray-500">
        The transaction may take up to 10 minutes
      </Typography>

      <DecoratedButton
        type="button"
        variant="primary"
        className="mt-8 w-full"
        onClick={() => {
          router.push(`/teams/${teamId}/affiliate-program/earnings`);
        }}
      >
        Continue
      </DecoratedButton>
    </div>
  );
};
