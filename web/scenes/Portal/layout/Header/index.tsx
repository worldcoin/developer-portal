"use client";

import { Button } from "@/components/Button";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { isWorldId40Enabled, worldId40Atom } from "@/lib/feature-flags";
import { atom, useAtom, useSetAtom } from "jotai";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import { colorAtom } from "../color-atom";
import { Color } from "../../Profile/types";
import { AppSelector } from "../AppSelector";
import { CreateAppDialog } from "../CreateAppDialog";
import { CreateAppDialogV4 } from "../CreateAppDialog/index-v4";

export const createAppDialogOpenedAtom = atom(false);

export const Header = (props: { color: Color | null }) => {
  const setColor = useSetAtom(colorAtom);
  const [open, setOpen] = useAtom(createAppDialogOpenedAtom);
  const [worldId40Config] = useAtom(worldId40Atom);
  const { teamId } = useParams() as { teamId?: string };

  useEffect(() => {
    setColor(props.color);
  }, [props.color, setColor]);

  const useNewCreateAppDialog = useMemo(
    () => isWorldId40Enabled(worldId40Config, teamId),
    [worldId40Config, teamId],
  );

  return (
    <header className="max-md:sticky max-md:top-0 max-md:z-10 max-md:mb-6 max-md:border-b max-md:border-gray-200 max-md:bg-grey-0">
      <SizingWrapper
        className="flex w-full items-center justify-between gap-x-4"
        gridClassName="py-4"
        variant="nav"
      >
        <div className="grid grid-cols-auto/1fr gap-x-4 md:gap-x-8">
          <Button href="/">
            <WorldIcon className="size-6" />
          </Button>

          <AppSelector />
        </div>

        <LoggedUserNav />
      </SizingWrapper>

      {useNewCreateAppDialog ? (
        <CreateAppDialogV4 open={open} onClose={setOpen} className={"mx-0"} />
      ) : (
        <CreateAppDialog open={open} onClose={setOpen} className={"mx-0"} />
      )}
    </header>
  );
};
