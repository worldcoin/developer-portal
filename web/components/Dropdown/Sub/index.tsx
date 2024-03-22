import {
  createContext,
  Dispatch,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";

type SubContextValue = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export const subContext = createContext({} as SubContextValue);

type SubProps = Omit<
  DropdownPrimitive.DropdownMenuSubProps,
  "open" | "onOpenChange"
> & {};

export const Sub = (props: SubProps) => {
  const { children, ...otherProps } = props;
  const [open, setOpen] = useState(false);

  const contextValue = useMemo(() => {
    return {
      open,
      setOpen,
    };
  }, [open]);

  return (
    <subContext.Provider value={contextValue}>
      <DropdownPrimitive.Sub open={open} onOpenChange={setOpen} {...otherProps}>
        {children}
      </DropdownPrimitive.Sub>
    </subContext.Provider>
  );
};
