"use client";

import { CaretIcon } from "@/components/Icons/CaretIcon";
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
import { Color } from "@/scenes/common/colors";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { CSSProperties, ReactNode } from "react";

export type PortalUser = { name: string; email?: string };

const itemClass =
  "flex cursor-pointer items-center gap-2 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none data-[highlighted]:bg-muted";

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
const UserAvatar = (props: { name: string; color: Color | null }) => {
  const { color } = props;
  return (
    <div
      className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase"
      style={
        color
          ? ({
              backgroundColor: color[100],
              color: color[500],
            } as CSSProperties)
          : { backgroundColor: "#e5e7eb", color: "#6b7280" }
      }
    >
      {props.name[0]}
    </div>
  );
};

export const UserPopup = (props: { user: PortalUser; color: Color | null }) => {
  const { user, color } = props;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="hover:bg-muted focus-visible:ring-ring flex w-full items-center gap-2.5 rounded-8 p-2 text-left outline-none focus-visible:ring-2">
        <UserAvatar name={user.name} color={color} />
        <span className="min-w-0 flex-1 truncate font-gta text-14 font-medium">
          {user.name}
        </span>
        <CaretIcon className="text-muted-foreground size-3 shrink-0 rotate-180" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={8}
          className="border-border bg-card text-foreground z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[224px] overflow-y-auto rounded-12 border p-1 shadow-lg"
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
