"use client";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { DecoratedButton } from "@/components/DecoratedButton";
import { MailWithLines } from "@/components/Icons/MailWithLines";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import {
  getIdentityVerificationLink,
  GetIdentityVerificationLinkResponse,
} from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/getIdentityVerificationLink";
import { toast } from "react-toastify";
import { useState } from "react";

export const NotVerified = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCompleteKyb = async () => {
    setIsLoading(true);

    try {
      const result = await getIdentityVerificationLink({
        type: "kyb",
        redirectUri: window.location.origin,
      });

      if (result.success && result.data) {
        // Navigate to verification link
        window.location.href = (
          result.data as GetIdentityVerificationLinkResponse
        ).link;
      } else {
        throw new Error(result.message || "Failed to get verification link");
      }
    } catch (error) {
      console.error("Failed to get verification link:", error);
      toast.error("Failed to start verification. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 justify-items-center pt-12">
      <MailWithLines className="md:max-w-[380px]" />

      <div className="mt-4 grid justify-items-center gap-y-2 ">
        <Typography variant={TYPOGRAPHY.H6}>
          Invite humans and earn rewards
        </Typography>

        <Typography
          variant={TYPOGRAPHY.R4}
          className="text-center text-grey-500"
        >
          Receive rewards for each human that uses your code and gets verified
        </Typography>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-grey-200 p-6 md:mt-10">
        <IconFrame className="bg-blue-500 text-grey-0">
          <IdentificationIcon />
        </IconFrame>

        <div className="text-start">
          <Typography as="p" variant={TYPOGRAPHY.M3}>
            Complete KYB
          </Typography>
          <Typography as="p" variant={TYPOGRAPHY.R5} className="text-grey-500">
            To unlock affiliate program
          </Typography>
        </div>
        <DecoratedButton
          type="button"
          onClick={handleCompleteKyb}
          className="h-9"
          disabled={isLoading}
        >
          {isLoading ? "Completing..." : "Complete"}
        </DecoratedButton>
      </div>
    </div>
  );
};
