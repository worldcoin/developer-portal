"use client";

import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { useUser } from "@auth0/nextjs-auth0/client";

export const Header = () => {
  const { user } = useUser();

  return (
    <header className="p-4">
      <SizingWrapper className="flex justify-between items-center w-full">
        <WorldcoinIcon />
        <LoggedUserNav name={user?.name ?? "User"} />
      </SizingWrapper>
    </header>
  );
};
