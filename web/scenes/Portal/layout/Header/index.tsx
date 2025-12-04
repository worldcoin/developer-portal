"use client";

import { Button } from "@/components/Button";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { CloseButton } from "@/scenes/Onboarding/CreateTeam/layout/CloseButton";
import { atom, useAtom, useSetAtom } from "jotai";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { colorAtom } from "..";
import { Color } from "../../Profile/types";
import { AppSelector } from "../AppSelector";
import { CreateAppDialog } from "../CreateAppDialog";

export const createAppDialogOpenedAtom = atom(false);

export const Header = (props: { color: Color | null }) => {
  const setColor = useSetAtom(colorAtom);
  const [open, setOpen] = useAtom(createAppDialogOpenedAtom);
  const { teamId, appId } = useParams() as { teamId?: string; appId?: string };

  useEffect(() => {
    setColor(props.color);
  }, [props.color, setColor]);

  const logoHref = useMemo(() => {
    if (teamId && appId) {
      return urls.app({ team_id: teamId, app_id: appId });
    }
    if (teamId) {
      return urls.teams({ team_id: teamId });
    }
    return "/";
  }, [teamId, appId]);
  const path = usePathname();

  const showCloseButton = useMemo(() => {
    return (
      path.includes(urls.affiliateWithdrawal({ team_id: teamId })) ||
      path.includes(urls.affiliateRewards({ team_id: teamId }))
    );
  }, [path, teamId]);

  const pageConfig = useMemo(() => {
    if (!showCloseButton) return null;
    if (path.includes(urls.affiliateWithdrawal({ team_id: teamId }))) {
      return {
        title: "Withdraw",
        href: urls.affiliateEarnings({ team_id: teamId }),
      };
    }
    if (path.includes(urls.affiliateRewards({ team_id: teamId }))) {
      return {
        title: "Rewards",
        href: urls.affiliateHowItWorks({ team_id: teamId }),
      };
    }
    return null;
  }, [path, showCloseButton, teamId]);

  return (
    <header className="max-md:sticky max-md:top-0 max-md:z-10 max-md:mb-6 max-md:border-b max-md:border-gray-200 max-md:bg-grey-0">
      <SizingWrapper
        className="flex w-full items-center justify-between gap-x-4"
        gridClassName="py-4"
        variant="nav"
      >
        {showCloseButton && (
          <div className="flex items-center gap-x-3">
            <CloseButton href={pageConfig?.href ?? undefined} />

            {pageConfig?.title && (
              <>
                <span className="text-grey-200">|</span>
                <Typography variant={TYPOGRAPHY.M4}>
                  {pageConfig.title}
                </Typography>
              </>
            )}
          </div>
        )}
        {!showCloseButton && (
          <div className="grid grid-cols-auto/1fr gap-x-4 md:gap-x-8">
            <Button href={logoHref}>
              <WorldIcon className="size-6" />
            </Button>

            <AppSelector />
          </div>
        )}

        <LoggedUserNav />
      </SizingWrapper>

      <CreateAppDialog open={open} onClose={setOpen} className={"mx-0"} />
    </header>
  );
};
