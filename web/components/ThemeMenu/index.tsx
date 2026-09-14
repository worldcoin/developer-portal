"use client";

import { usePortalThemeEnabled } from "@/components/PortalThemeProvider";
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { isThemePreference } from "@/lib/theme";
import { portalMenuItemClassName } from "@/lib/portal-menu-styles";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function ThemeMenu() {
  const enabled = usePortalThemeEnabled();
  const { theme, setTheme } = useTheme();
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
        value={mounted && isThemePreference(theme) ? theme : ""}
        onValueChange={(value) => {
          if (isThemePreference(value)) setTheme(value);
        }}
      >
        <DropdownMenuRadioItem
          className={portalMenuItemClassName}
          value="light"
        >
          <Sun className="size-4" />
          Light
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem className={portalMenuItemClassName} value="dark">
          <Moon className="size-4" />
          Dark
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          className={portalMenuItemClassName}
          value="system"
        >
          <Monitor className="size-4" />
          System
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
}
