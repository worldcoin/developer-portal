import { createContext, CSSProperties, useMemo } from "react";
import { DropdownProps } from "components/Dropdown";
import { autoUpdate, size, useFloating } from "@floating-ui/react";
import { Menu } from "@headlessui/react";

type DropdownDesktopContextValue = {
  setReference: (element: HTMLElement | null) => void;
  setFloating: (element: HTMLElement | null) => void;
  floatingStyles: CSSProperties;
};

export const dropdownDesktopContext = createContext(
  {} as DropdownDesktopContextValue,
);

export const DropdownDesktop = (props: DropdownProps) => {
  const { placement } = props;
  const { refs, floatingStyles } = useFloating({
    placement,
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      size({
        apply({ availableWidth, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            minWidth: "0px",
            maxWidth: `${availableWidth}px`,
            maxHeight: `${availableHeight}px`,
          });
        },
      }),
    ],
  });

  const contextValue = useMemo(
    () => ({
      setReference: refs.setReference,
      setFloating: refs.setFloating,
      floatingStyles,
    }),
    [refs, floatingStyles],
  );

  return (
    <dropdownDesktopContext.Provider value={contextValue}>
      <Menu>{props.children}</Menu>
    </dropdownDesktopContext.Provider>
  );
};

export default DropdownDesktop;
