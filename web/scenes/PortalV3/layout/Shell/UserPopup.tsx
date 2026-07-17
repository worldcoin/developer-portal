"use client";

import { urls } from "@/lib/urls";
import { Color } from "@/scenes/common/Profile/types";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { CSSProperties } from "react";

export type PortalUser = { name: string; email?: string };

const itemClass =
  "flex h-12 w-full cursor-pointer items-center gap-2 rounded-8 bg-white px-4 py-2 font-world text-13 font-medium leading-[1.2] text-portal-text outline-hidden data-highlighted:bg-grey-50";

const LinkItem = (props: { href: string; label: string; icon: string }) => (
  <DropdownMenu.Item asChild>
    <Link href={props.href} className={itemClass}>
      <Icon name={props.icon} className={`${opticalIconClassName} size-4`} />
      <span className="min-w-0 flex-1 truncate">{props.label}</span>
    </Link>
  </DropdownMenu.Item>
);

const Separator = () => (
  <Icon name="generic-divider" className="h-2 w-full shrink-0" />
);

/** Bottom-left account switcher and profile/status menu. */
const getInitials = (name: string) => {
  const parts = name
    .split(/[.\s@_-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (parts[0]?.[0] ?? "A") + (parts[1]?.[0] ?? "");
};

const UserAvatar = (props: { name: string; color: Color | null }) => {
  const { color } = props;
  return (
    <div
      className="flex size-6 shrink-0 items-center justify-center rounded-full font-world text-10 font-semibold uppercase"
      style={
        color
          ? ({
              backgroundColor: color[100],
              color: color[500],
            } as CSSProperties)
          : { backgroundColor: "#e5e7eb", color: "#6b7280" }
      }
    >
      {getInitials(props.name)}
    </div>
  );
};

export const UserPopup = (props: { user: PortalUser; color: Color | null }) => {
  const { user, color } = props;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex h-10 w-full min-w-0 items-center gap-2 rounded-8 text-left outline-hidden transition-colors hover:bg-portal-border focus-visible:ring-2 focus-visible:ring-grey-300">
        <UserAvatar name={user.name} color={color} />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate font-world text-13 leading-none font-medium text-portal-text">
            {user.name}
          </span>
          <span className="font-world text-11 leading-none text-portal-subtle">
            Profile
          </span>
        </span>
        <Icon
          name="arrow-separate-vertical"
          className={`${opticalIconClassName} size-4`}
        />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={16}
          className="z-50 max-h-(--radix-dropdown-menu-content-available-height) w-[279px] overflow-y-auto rounded-[10px] border border-portal-border bg-white p-0 shadow-[0_18px_11px_0_rgba(24,24,24,0.02),0_8px_8px_0_rgba(24,24,24,0.03),0_2px_4px_0_rgba(24,24,24,0.03)]"
        >
          <div className="flex w-full flex-col items-start py-2">
            <LinkItem
              href={urls.profile()}
              label="Profile"
              icon="profile-menu-profile"
            />
            <LinkItem
              href={urls.profileTeams()}
              label="My Teams"
              icon="profile-menu-teams"
            />
            <Separator />
            <DropdownMenu.Item asChild>
              <a
                href={urls.logout()}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.assign(urls.logout(window.location.origin));
                }}
                className={itemClass}
              >
                <Icon
                  name="profile-menu-log-out"
                  className={`${opticalIconClassName} size-4`}
                />
                <span className="min-w-0 flex-1 truncate">Log out</span>
              </a>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
