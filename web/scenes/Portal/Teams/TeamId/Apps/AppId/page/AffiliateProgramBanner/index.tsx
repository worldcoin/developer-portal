"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import Image from "next/image";
import mailImage from "./mail.png";

interface AffiliateProgramBannerProps {
  teamId: string;
  hasVerifiedApps: boolean;
  className?: string;
}

export const AffiliateProgramBanner = ({
  teamId,
  hasVerifiedApps,
  className,
}: AffiliateProgramBannerProps) => {
  if (!hasVerifiedApps) {
    return null;
  }

  return (
    <div
      className={clsx(
        "mt-10 mb-3 w-full rounded-[24px] border border-[#D9E0FD] bg-[linear-gradient(0deg,rgba(187,209,255,0.52)_0%,rgba(187,209,255,0.13)_100%)]",
        className,
      )}
    >
      <div className="flex items-center justify-between p-8">
        <div className="flex items-center gap-5">
          <Image
            src={mailImage}
            alt="mail image"
            height={52}
            width={52}
            className="h-13 w-13 shrink-0"
            aria-hidden
          />
          <div className="flex flex-col gap-1">
            <Typography variant={TYPOGRAPHY.H7}>
              Invite humans and earn rewards
            </Typography>
            <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
              Receive rewards for each human that uses your code and gets verified
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DecoratedButton
            href={`/teams/${teamId}/affiliate-program/verify`}
            variant="primary"
            className="h-12 rounded-[10px] border-transparent outline outline-1 outline-offset-[-1px] outline-white/20"
          >
            Earn rewards
          </DecoratedButton>
        </div>
      </div>
    </div>
  );
};
