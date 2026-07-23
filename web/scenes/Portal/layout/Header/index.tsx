"use client";

import { Button } from "@/components/Button";
import { WORLD_ID_SANDBOX_ENABLED } from "@/lib/constants";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { useAtom, useSetAtom } from "jotai";
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import { colorAtom } from "@/scenes/common/layout/color-atom";
import { Color } from "@/scenes/common/Profile/types";
import { SandboxButton } from "@/scenes/PortalV3/layout/Shell/SandboxButton";
import { AppSelector } from "../AppSelector";
import { CreateAppDialogV4 } from "../CreateAppDialog/index-v4";

import { createAppDialogOpenedAtom } from "@/scenes/common/layout/Header/atoms";

export const Header = (props: { color: Color | null }) => {
  const setColor = useSetAtom(colorAtom);
  const [open, setOpen] = useAtom(createAppDialogOpenedAtom);
  const { teamId } = useParams() as { teamId?: string };
  const sandboxEnabled = Boolean(teamId) && WORLD_ID_SANDBOX_ENABLED;

  useEffect(() => {
    setColor(props.color);
  }, [props.color, setColor]);

  const logoHref = teamId ? urls.teams({ team_id: teamId }) : "/";

  return (
    <header className="max-md:sticky max-md:top-0 max-md:z-10 max-md:mb-6 max-md:border-b max-md:border-gray-200 max-md:bg-grey-0">
      <SizingWrapper
        className="flex w-full items-center justify-between gap-x-4"
        gridClassName="py-4"
        variant="nav"
      >
        <div className="grid grid-cols-auto/1fr gap-x-4 md:gap-x-8">
          <Button href={logoHref}>
            <WorldIcon className="size-6" />
          </Button>

          <AppSelector />
        </div>

        <div className="flex items-center gap-x-4">
          {sandboxEnabled ? (
            <SandboxButton className="w-60 max-md:hidden" />
          ) : null}
          <LoggedUserNav />
        </div>
      </SizingWrapper>

      <CreateAppDialogV4 open={open} onClose={setOpen} className={"mx-0"} />
    </header>
  );
};
