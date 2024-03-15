import { createContext, lazy, ReactNode, useMemo } from "react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Button } from "./Button";
import { Item } from "./Item";
import { Items } from "./Items";

type DropdownContextValue = {
  isDesktop: boolean;
};

export const dropdownContext = createContext({} as DropdownContextValue);

export type DropdownProps = {
  children: ReactNode;
  placement?: "bottom-end" | "left-start";
};

const DropdownDesktopComponent = lazy(
  () => import("components/Dropdown@desktop"),
);
const DropdownMobileComponent = lazy(
  () => import("components/Dropdown@mobile"),
);

export const Dropdown = (props: DropdownProps) => {
  const isDesktop = useMediaQuery("only screen and (min-width: 768px)");

  const contextValue = useMemo(
    () => ({
      isDesktop,
    }),
    [isDesktop],
  );

  const DropdownComponent = isDesktop
    ? DropdownDesktopComponent
    : DropdownMobileComponent;

  return (
    <dropdownContext.Provider value={contextValue}>
      <DropdownComponent placement={props.placement}>
        {props.children}
      </DropdownComponent>
    </dropdownContext.Provider>
  );
};

Dropdown.Button = Button;
Dropdown.Item = Item;
Dropdown.Items = Items;
