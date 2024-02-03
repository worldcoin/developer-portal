"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "../Button";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "../Dropdown";
import { LogoutIcon } from "../Icons/LogoutIcon";
import { TYPOGRAPHY, Typography } from "../Typography";
import { Auth0SessionUser } from "@/lib/types";
import { UserCircleIcon } from "../Icons/UserCircleIcon";
import { DOCS_URL } from "@/lib/constants";

export const LoggedUserNav = (props: { name: string }) => {
  const nameFirstLetter = props.name.charAt(0).toUpperCase();
  const { user } = useUser() as Auth0SessionUser;

  return (
    <div className="flex items-center gap-x-5">
      {/* FIXME: update url for Help */}
      <Button href="#">
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Help
        </Typography>
      </Button>

      <Button href={DOCS_URL}>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Docs
        </Typography>
      </Button>

      <Dropdown>
        <DropdownButton>
          <span className="h-6 w-6 text-xs flex justify-center items-center bg-additional-pink-100 text-additional-pink-500 rounded-full transition-colors">
            {nameFirstLetter}
          </span>
        </DropdownButton>

        <DropdownItems className="max-w-[200px] mt-2">
          <Typography
            as="div"
            variant={TYPOGRAPHY.R4}
            className="truncate max-w-full px-4 py-2.5 text-grey-400"
          >
            {user?.email}
          </Typography>

          <DropdownItem>
            <Button
              href="/profile"
              className="grid grid-cols-auto/1fr items-center gap-x-2"
            >
              <UserCircleIcon className="text-grey-400" />
              <Typography variant={TYPOGRAPHY.R4}>Profile</Typography>
            </Button>
          </DropdownItem>

          <hr className="border-grey-200" />

          <DropdownItem>
            <Button
              href="/api/auth/logout"
              className="grid grid-cols-auto/1fr items-center gap-x-2 text-system-error-600"
            >
              <LogoutIcon className="w-4 h-4" />
              <Typography variant={TYPOGRAPHY.R4}>Log out</Typography>
            </Button>
          </DropdownItem>
        </DropdownItems>
      </Dropdown>
    </div>
  );
};
