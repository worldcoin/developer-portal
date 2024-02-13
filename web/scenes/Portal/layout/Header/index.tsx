"use client";

import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { atom, useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { colorAtom } from "..";
import { Color } from "../../Profile/types";
import { AppSelector } from "../AppSelector";
import { CreateAppDialog } from "../CreateAppDialog";

export const createAppDialogOpenedAtom = atom(false);

export const Header = (props: { color: Color | null }) => {
  useHydrateAtoms([[colorAtom, props.color]]);
  const [open, setOpen] = useAtom(createAppDialogOpenedAtom);

  return (
    <header className="p-4">
      <SizingWrapper
        className="flex w-full items-center justify-between"
        variant="nav"
      >
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
