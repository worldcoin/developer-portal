"use client";

import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Color } from "../../Profile/types";
import { useHydrateAtoms } from "jotai/utils";
import { colorAtom } from "..";
import { AppSelector } from "../AppSelector";
import { CreateAppDialog } from "../CreateAppDialog";
import { atom, useAtom } from "jotai";

export const createAppDialogOpenedAtom = atom(false);

export const Header = (props: { color: Color | null }) => {
  useHydrateAtoms([[colorAtom, props.color]]);
  const [open, setOpen] = useAtom(createAppDialogOpenedAtom);

  return (
    <header className="p-4">
      <SizingWrapper className="flex justify-between items-center w-full">
        <div className="grid grid-cols-auto/1fr gap-x-8">
          <WorldcoinIcon />
          <AppSelector />
        </div>

        <LoggedUserNav />
      </SizingWrapper>

      <CreateAppDialog open={open} onClose={setOpen} />
    </header>
  );
};
