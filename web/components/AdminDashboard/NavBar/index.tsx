import clsx from "clsx";
import { Building2, Home, LayoutGrid, Users } from "lucide-react";
import { UIModule } from "../UIModule";
import { CollapseButton } from "./CollapseButton";
import { NavBarItem } from "./NavBarItem";

const iconClassName = clsx("size-6", "lg:size-4", "3xl:size-5", "4xl:size-7");

export const NavBar = () => {
  return (
    <UIModule
      className={clsx(
        // Base (mobile): floating bottom tab bar
        "sticky bottom-4 z-40 w-fit justify-self-center",

        // Desktop: floating sidebar card, sticky within the viewport
        "lg:bottom-auto lg:top-4 lg:order-first lg:mx-0 lg:mb-0 lg:w-full lg:translate-x-0 lg:self-start lg:justify-self-auto",
        "lg:grid lg:h-[calc(100dvh-2rem)] lg:content-start lg:justify-items-start lg:gap-y-1",
        "lg:p-3",

        // Large monitors
        "3xl:p-4",
        "4xl:p-5",
      )}
    >
      <CollapseButton />

      <nav
        id="admin-nav-items"
        aria-label="Admin"
        className={clsx(
          // Base (mobile): horizontal row of items
          "flex gap-x-1",

          // Desktop: vertical list
          "lg:grid lg:gap-x-0 lg:gap-y-0.5",
          "3xl:gap-y-1",
          "4xl:gap-y-1.5",
        )}
      >
        <NavBarItem icon={<Home className={iconClassName} />} href="/admin">
          Home
        </NavBarItem>

        <NavBarItem
          icon={<Building2 className={iconClassName} />}
          href="/admin/teams"
        >
          Teams
        </NavBarItem>

        <NavBarItem
          icon={<LayoutGrid className={iconClassName} />}
          href="/admin/apps"
        >
          Apps
        </NavBarItem>

        <NavBarItem
          icon={<Users className={iconClassName} />}
          href="/admin/users"
        >
          Users
        </NavBarItem>
      </nav>
    </UIModule>
  );
};
