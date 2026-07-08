"use client";

import {
  DISCORD_URL,
  DOCS_URL,
  FAQ_URL,
  TELEGRAM_DEVELOPERS_GROUP_URL,
  TELEGRAM_MATEO_URL,
  WORLD_PRIVACY_URL,
  WORLD_STATUS_URL,
} from "@/lib/constants";
import { urls } from "@/lib/urls";
import { Color } from "@/scenes/common/Profile/types";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { CSSProperties, ReactNode } from "react";

export type PortalUser = { name: string; email?: string };

const itemClass =
  "flex cursor-pointer items-center gap-2 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none data-[highlighted]:bg-grey-100";

const LinkItem = (props: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) => (
  <DropdownMenu.Item asChild>
    {props.external ? (
      <a
        href={props.href}
        target="_blank"
        rel="noreferrer"
        className={itemClass}
      >
        {props.children}
      </a>
    ) : (
      <Link href={props.href} className={itemClass}>
        {props.children}
      </Link>
    )}
  </DropdownMenu.Item>
);

const SectionHeader = (props: { children: ReactNode }) => (
  <DropdownMenu.Label className="text-muted-foreground px-2.5 pb-1 pt-2 font-gta text-12">
    {props.children}
  </DropdownMenu.Label>
);

const Separator = () => (
  <DropdownMenu.Separator className="bg-border my-1 h-px" />
);

/**
 * Bottom-left user popup (presentational): Profile · My Teams · the help menu
 * (mirrored from the main repo's <Help />: support · community · references) ·
 * Docs · Log out.
 */
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
      <DropdownMenu.Trigger className="flex h-10 w-full min-w-0 items-center gap-2 rounded-8 text-left outline-none transition-colors hover:bg-portal-border focus-visible:ring-2 focus-visible:ring-grey-300">
        <UserAvatar name={user.name} color={color} />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate font-world text-13 font-medium leading-none text-portal-text">
            {user.name}
          </span>
          <span className="font-world text-11 leading-none text-portal-subtle">
            Profile
          </span>
        </span>
        <Icon name="more-horizontal" className="size-4 shrink-0" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={8}
          className="z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] w-[247px] overflow-y-auto rounded-12 border border-portal-border bg-white p-1 shadow-lg"
        >
          {user.email ? (
            <div className="text-muted-foreground truncate px-2.5 py-1.5 text-12">
              {user.email}
            </div>
          ) : null}

          <LinkItem href={urls.profile()}>Profile</LinkItem>
          <LinkItem href={urls.profileTeams()}>My Teams</LinkItem>

          <Separator />

          <SectionHeader>Need help with your app?</SectionHeader>
          <LinkItem href={WORLD_PRIVACY_URL} external>
            Data Privacy & Security
          </LinkItem>
          <LinkItem href={WORLD_STATUS_URL} external>
            World Status
          </LinkItem>
          <LinkItem href={FAQ_URL} external>
            FAQ
          </LinkItem>

          <Separator />

          <SectionHeader>Community support</SectionHeader>
          <LinkItem href={TELEGRAM_DEVELOPERS_GROUP_URL} external>
            Join our Telegram
          </LinkItem>
          <LinkItem href={TELEGRAM_MATEO_URL} external>
            Text Mateo
          </LinkItem>
          <LinkItem href={DISCORD_URL} external>
            Join our Discord
          </LinkItem>

          <Separator />

          <SectionHeader>References</SectionHeader>
          <LinkItem href={urls.privacyStatement()} external>
            Privacy Policy
          </LinkItem>
          <LinkItem href={urls.tos()} external>
            Terms of service
          </LinkItem>

          <Separator />

          <LinkItem href={DOCS_URL} external>
            Docs
          </LinkItem>

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
              Log out
            </a>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
