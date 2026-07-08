import clsx from "clsx";
import { Building2, Home, LayoutGrid, Users } from "lucide-react";
import { CollapseButton } from "./CollapseButton";
import { NavBarItem } from "./NavBarItem";

const iconClassName = "size-6 lg:size-4";

export const NavBar = () => {
  return (
    <div
      className={clsx(
        // Base (mobile): floating bottom tab bar
        "fixed bottom-4 left-1/2 z-40 -translate-x-1/2",
        "rounded-16 border border-grey-200 bg-grey-0/90 p-1.5 shadow-lg backdrop-blur-md",

        // Desktop: full-height sidebar
        "lg:relative lg:bottom-auto lg:left-[unset] lg:translate-x-0",
        "lg:grid lg:content-start lg:justify-items-start lg:gap-y-1",
        "lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r lg:bg-grey-25 lg:p-3 lg:shadow-none lg:backdrop-blur-none",
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
    </div>
  );
};
