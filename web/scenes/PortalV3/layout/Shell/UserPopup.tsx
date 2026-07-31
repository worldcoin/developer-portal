"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { urls } from "@/lib/urls";
import { Color } from "@/scenes/common/Profile/types";
import { colorAtom } from "@/scenes/common/layout/color-atom";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { useAtomValue } from "jotai";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { CSSProperties } from "react";
import { HelpCenterMenu } from "./HelpCenterMenu";

export type PortalUser = { name: string; email?: string };

const itemClass =
  "h-10 cursor-pointer rounded-8 px-3 text-portal-text focus:bg-portal-hover";

const accountLinks = [
  {
    href: urls.profile(),
    label: "Profile",
    icon: "profile-menu-profile",
  },
];

const themeOptions = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

const ThemeSubmenu = () => {
  // Rendered only inside the opened (client-mounted) dropdown, so reading the
  // resolved theme here can't cause a hydration mismatch.
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={itemClass}>
        <SunIcon
          className={`${opticalIconClassName} size-4 text-portal-muted`}
        />
        <span className="min-w-0 flex-1 truncate">Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-40 border border-portal-border font-world">
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={itemClass}
            onClick={() => setTheme(option.value)}
          >
            <option.icon
              className={`${opticalIconClassName} size-4 text-portal-muted`}
            />
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {theme === option.value && (
              <CheckIcon className={`${opticalIconClassName} size-4`} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

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
    <Avatar className="size-6">
      <AvatarFallback
        className="font-world text-10 font-semibold uppercase"
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
      </AvatarFallback>
    </Avatar>
  );
};

export const UserPopup = (props: { user: PortalUser; color: Color | null }) => {
  const { user } = props;
  const selectedColor = useAtomValue(colorAtom);
  const color = selectedColor ?? props.color;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label="Account menu"
              title={user.name}
              className="cursor-pointer text-portal-text hover:bg-portal-hover focus-visible:bg-portal-hover focus-visible:ring-0 data-open:bg-portal-hover"
            >
              <UserAvatar name={user.name} color={color} />
              <span className="min-w-0 flex-1 truncate font-world text-13 leading-none font-medium group-data-[collapsible=icon]:hidden">
                {user.name}
              </span>
              <ChevronsUpDownIcon className="ml-auto size-4 text-portal-muted group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-(--radix-dropdown-menu-trigger-width) border border-portal-border font-world"
          >
            {accountLinks.map((item) => (
              <DropdownMenuItem key={item.href} asChild className={itemClass}>
                <Link href={item.href}>
                  <Icon
                    name={item.icon}
                    className={`${opticalIconClassName} size-4`}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            <HelpCenterMenu />
            <ThemeSubmenu />
            <DropdownMenuSeparator className="my-2 bg-portal-border" />
            <DropdownMenuItem asChild className={itemClass}>
              <a
                href={urls.logout()}
                onClick={(event) => {
                  event.preventDefault();
                  window.location.assign(urls.logout(window.location.origin));
                }}
              >
                <Icon
                  name="profile-menu-log-out"
                  className={`${opticalIconClassName} size-4`}
                />
                <span className="min-w-0 flex-1 truncate">Log out</span>
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
