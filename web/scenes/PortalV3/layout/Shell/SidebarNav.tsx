"use client";

import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCurrentAppId } from "./AppsDropdown";
import { NavItem } from "./NavItem";
import { buildSidebarNavigation } from "./sidebar-navigation";
import type {
  AppEnvironmentFlags,
  SidebarNavigationItem,
} from "./sidebar-navigation";

const appEnvironmentFlagsAtom = atom<AppEnvironmentFlags | undefined>(
  undefined,
);

/** Publishes server-fetched app capabilities to the persistent sidebar. */
export const AppEnvFlagsSync = (props: AppEnvironmentFlags) => {
  const { appId, hasRpRegistration, hasLegacyActions } = props;
  const setFlags = useSetAtom(appEnvironmentFlagsAtom);

  useEffect(() => {
    setFlags({ appId, hasRpRegistration, hasLegacyActions });
  }, [appId, hasRpRegistration, hasLegacyActions, setFlags]);

  return null;
};

const SidebarItems = ({ items }: { items: SidebarNavigationItem[] }) =>
  items.map((item) => (
    <NavItem
      key={item.label}
      label={item.label}
      href={item.href}
      active={item.active}
      dimmed={item.dimmed}
    />
  ));

export const SidebarNav = () => {
  const { user } = useUser() as Auth0SessionUser;
  const pathname = usePathname() ?? "";
  const params = useParams<{ teamId?: string; appId?: string }>();
  const teamId = params?.teamId;
  const routeAppId = params?.appId;
  const selectedAppId = useCurrentAppId();
  const appEnvironmentFlags = useAtomValue(appEnvironmentFlagsAtom);

  const navigation = buildSidebarNavigation({
    pathname,
    teamId,
    routeAppId,
    selectedAppId,
    appEnvironmentFlags,
    canSeeApiKeys: checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]),
    canSeeSettings: checkUserPermissions(user, teamId ?? "", [Role_Enum.Owner]),
  });

  if (navigation.kind === "section") {
    return (
      <nav className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        <NavItem
          label={navigation.label}
          href={navigation.backHref}
          icon={<ChevronLeftIcon className="size-4" />}
        />
        <SidebarItems items={navigation.items} />
      </nav>
    );
  }

  return (
    <nav className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      <SidebarItems items={navigation.appItems} />

      {navigation.appItems.length > 0 && navigation.teamItems.length > 0 ? (
        <div className="border-border my-2 border-t" />
      ) : null}

      <SidebarItems items={navigation.teamItems} />
    </nav>
  );
};
