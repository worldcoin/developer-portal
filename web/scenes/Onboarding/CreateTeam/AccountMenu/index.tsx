"use client";

import { LogoutIcon } from "@/components/Icons/LogoutIcon";
import { urls } from "@/lib/urls";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export const CreateTeamAccountMenu = ({
  userInitial,
}: {
  userInitial: string;
}) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Open account menu"
        className="grid size-10 cursor-pointer place-items-center bg-transparent p-0 text-[#171717] outline-hidden md:size-12"
      >
        <span
          aria-hidden="true"
          className="pb-px font-world text-16 leading-none font-medium"
        >
          {userInitial}
        </span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="z-1000 w-[180px] overflow-hidden rounded-[4px] border border-black/15 bg-[#faf9f7]/95 p-0 font-world shadow-[0_20px_45px_rgba(16,16,16,0.12)] backdrop-blur-md data-[state=open]:animate-dropdown-content-enter-desktop"
        >
          <DropdownMenu.Item asChild>
            <a
              href={urls.logout()}
              onClick={(event) => {
                event.preventDefault();
                window.location.assign(urls.logout(window.location.origin));
              }}
              className="flex h-12 w-full cursor-pointer items-center gap-3 px-4 text-14 leading-none font-medium text-[#171717] outline-hidden transition-colors hover:bg-[#171717] hover:text-white data-highlighted:bg-[#171717] data-highlighted:text-white"
            >
              <LogoutIcon className="size-4" />
              <span>Log out</span>
            </a>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
