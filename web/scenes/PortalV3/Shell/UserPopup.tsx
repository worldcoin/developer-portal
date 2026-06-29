"use client";

import { CaretIcon } from "@/components/Icons/CaretIcon";
import { DOCS_URL, FAQ_URL } from "@/lib/constants";
import { Color } from "@/lib/calculate-color-from-string";
import { urls } from "@/lib/urls";
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

const UserAvatar = (props: { name: string; color: Color | null }) => (
  <div
    className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase"
    style={
      props.color
        ? ({
            backgroundColor: props.color[100],
            color: props.color[500],
          } as CSSProperties)
        : { backgroundColor: "#e5e7eb", color: "#6b7280" }
    }
  >
    {props.name[0]}
  </div>
);

export const UserPopup = (props: { user: PortalUser; color: Color | null }) => {
  const { user } = props;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex w-full items-center gap-2.5 rounded-8 px-2 py-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <UserAvatar name={user.name} color={props.color} />
        <span className="min-w-0 flex-1 truncate font-gta text-14 font-medium">
          {user.email ?? user.name}
        </span>
        <CaretIcon className="size-3 shrink-0 rotate-180 text-muted-foreground" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={8}
          className="z-50 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[224px] rounded-12 border border-border bg-card p-1 text-foreground shadow-lg"
        >
          {user.email ? (
            <div className="truncate px-2.5 py-1.5 text-12 text-muted-foreground">
              {user.email}
            </div>
          ) : null}
          <LinkItem href={urls.profile()}>Profile</LinkItem>
          <LinkItem href={urls.profileTeams()}>My Teams</LinkItem>
          <LinkItem href={FAQ_URL} external>
            Help
          </LinkItem>
          <LinkItem href={DOCS_URL} external>
            Docs
          </LinkItem>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild>
            <a href={urls.logout()} className={itemClass}>
              Log out
            </a>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
