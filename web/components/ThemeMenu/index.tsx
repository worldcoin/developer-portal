"use client";

import { usePortalThemeEnabled } from "@/components/PortalThemeProvider";
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { portalMenuItemClassName } from "@/lib/portal-menu-styles";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function ThemeMenu() {
  const enabled = usePortalThemeEnabled();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  );
  if (!enabled) return null;
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-portal-muted">
        Appearance
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        aria-label="Appearance"
        value={mounted ? resolvedTheme : ""}
      >
        <DropdownMenuRadioItem
          className={portalMenuItemClassName}
          value="light"
          onSelect={(event) => {
            event.preventDefault();
            setTheme("light");
          }}
        >
          <Sun className="size-4" />
          Light
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          className={portalMenuItemClassName}
          value="dark"
          onSelect={(event) => {
            event.preventDefault();
            setTheme("dark");
          }}
        >
          <Moon className="size-4" />
          Dark
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
}
