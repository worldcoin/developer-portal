import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import { DropdownProps } from "components/Dropdown";

type DropdownMobileContextValue = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
};

export const dropdownMobileContext = createContext<
  DropdownMobileContextValue | undefined
>(undefined);

export const DropdownMobile = (props: DropdownProps) => {
  const parentContext = useContext(dropdownMobileContext);

  const [open, setOpen] = useState(false);

  const contextValue = useMemo(
    () => ({
      open,
      setOpen,
      onClose() {
        if (parentContext) {
          parentContext.onClose();
        }
        setOpen(false);
      },
    }),
    [open, setOpen, parentContext],
  );

  return (
    <dropdownMobileContext.Provider value={contextValue}>
      <div>{props.children}</div>
    </dropdownMobileContext.Provider>
  );
};

export default DropdownMobile;
