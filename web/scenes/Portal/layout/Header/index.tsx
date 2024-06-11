"use client";

import { Button } from "@/components/Button";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { atom, useAtom, useSetAtom } from "jotai";
import { useEffect } from "react";
import { colorAtom } from "..";
import { Color } from "../../Profile/types";
import { AppSelector } from "../AppSelector";
import { CreateAppDialog } from "../CreateAppDialog";

export const createAppDialogOpenedAtom = atom(false);

export const Header = (props: { color: Color | null }) => {
  const setColor = useSetAtom(colorAtom);
  const [open, setOpen] = useAtom(createAppDialogOpenedAtom);

  useEffect(() => {
    setColor(props.color);
  }, [props.color, setColor]);

  return (
    <header className="max-md:sticky max-md:top-0 max-md:z-10 max-md:mb-6 max-md:border-b max-md:border-gray-200 max-md:bg-grey-0">
      <SizingWrapper
        className="flex w-full items-center justify-between gap-x-4"
        gridClassName="py-4"
        variant="nav"
      >
        <div className="grid grid-cols-auto/1fr gap-x-4 md:gap-x-8">
          <Button href="/">
            <WorldcoinIcon />
          </Button>

          <AppSelector />
        </div>

        <LoggedUserNav />
      </SizingWrapper>

      <CreateAppDialog open={open} onClose={setOpen} className={"mx-0"} />
    </header>
  );
};
