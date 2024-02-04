"use client";

import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Color } from "../../Profile/types";
import { useHydrateAtoms } from "jotai/utils";
import { colorAtom } from "..";

export const Header = (props: { color: Color | null }) => {
  const { user } = useUser();
  useHydrateAtoms([[colorAtom, props.color]]);

  return (
    <header className="p-4">
      <SizingWrapper className="flex justify-between items-center w-full">
        <WorldcoinIcon />
        <LoggedUserNav />
      </SizingWrapper>
    </header>
  );
};
