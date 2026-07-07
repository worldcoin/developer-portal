import { Building2, Home, LayoutGrid, Users } from "lucide-react";
import { CollapseButton } from "./CollapseButton";
import { NavBarItem } from "./NavBarItem";

export const NavBar = () => {
  return (
    <div className="bg-grey-100 p-4">
      <CollapseButton />

      <nav id="admin-nav-items" aria-label="Admin" className="grid gap-y-1">
        <NavBarItem icon={<Home size={16} />} href="/">
          Home
        </NavBarItem>

        <NavBarItem icon={<Building2 size={16} />} href="/teams">
          Teams
        </NavBarItem>

        <NavBarItem icon={<LayoutGrid size={16} />} href="/apps">
          Apps
        </NavBarItem>

        <NavBarItem icon={<Users size={16} />} href="/users">
          Users
        </NavBarItem>
      </nav>
    </div>
  );
};
