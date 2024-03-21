import {
  createContext,
  Dispatch,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { Button } from "./Button";
import { List } from "./List";
import { ListHeader } from "./ListHeader";
import { ListItem } from "./ListItem";
import { ListItemIcon } from "./ListItemIcon";
import { ListItemText } from "./ListItemText";
import { ListSeparator } from "./ListSeparator";
import { Sub } from "./Sub";
import { SubButton } from "./SubButton";
import { SubList } from "./SubList";

type DropdownContextValue = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export const dropdownContext = createContext({} as DropdownContextValue);

export type DropdownProps = DropdownPrimitive.DropdownMenuProps & {};

export const Dropdown = (props: DropdownProps) => {
  const { children, ...otherProps } = props;
  const [open, setOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
  };

  const contextValue = useMemo(() => {
    return {
      open,
      setOpen,
    };
  }, [open]);

  return (
    <dropdownContext.Provider value={contextValue}>
      <DropdownPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        {children}
      </DropdownPrimitive.Root>
    </dropdownContext.Provider>
  );
};

Dropdown.Button = Button;
Dropdown.List = List;
Dropdown.ListHeader = ListHeader;
Dropdown.ListItem = ListItem;
Dropdown.ListItemIcon = ListItemIcon;
Dropdown.ListItemText = ListItemText;
Dropdown.ListSeparator = ListSeparator;
Dropdown.Sub = Sub;
Dropdown.SubButton = SubButton;
Dropdown.SubList = SubList;
