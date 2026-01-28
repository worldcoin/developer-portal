"use client";

import { Button } from "@/components/Button";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { useParams, useRouter } from "next/navigation";
import { ReactNode } from "react";

export type OnboardingLayoutProps = {
  /** Header title shown next to [X] for this onboarding flow. */
  title: string;
  children: ReactNode;
};

export const OnboardingLayout = ({
  title,
  children,
}: OnboardingLayoutProps) => {
  const router = useRouter();
  const { teamId, appId } = useParams() as {
    teamId?: string;
    appId?: string;
  };

  const onClose = () => {
    if (teamId && appId) {
      router.push(urls.app({ team_id: teamId, app_id: appId }));
    } else if (teamId) {
      router.push(urls.apps({ team_id: teamId }));
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-grey-100 bg-white py-4">
        <SizingWrapper>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <Button type="button" onClick={onClose} className="flex">
                <CloseIcon className="size-4" />
              </Button>
              <span className="text-grey-200">|</span>
              <Typography variant={TYPOGRAPHY.M4}>{title}</Typography>
            </div >
            <LoggedUserNav />
          </div >
        </SizingWrapper >
      </header >
      {children}
    </div >
  );
};
