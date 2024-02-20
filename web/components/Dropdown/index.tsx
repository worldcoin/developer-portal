import { autoUpdate, size, useFloating } from "@floating-ui/react";
import { Menu, MenuProps } from "@headlessui/react";
import { CSSProperties, createContext, useMemo } from "react";

export * from "./Button";
export * from "./Item";
export * from "./Items";

type DropdownContextValue = {
  setReference: (element: HTMLElement | null) => void;
  setFloating: (element: HTMLElement | null) => void;
  floatingStyles: CSSProperties;
};

export const dropdownContext = createContext({} as DropdownContextValue);

type DropdownProps<T> = MenuProps<"div"> & {
  placement?: "bottom-end" | "left-start";
  zIndex?: number;
};

export const Dropdown = <T,>(props: DropdownProps<T>) => {
  const { placement = "bottom-end", zIndex = 0, ...otherProps } = props;
  const { refs, floatingStyles } = useFloating({
    placement,
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      size({
        apply({ availableWidth, availableHeight, elements, rects }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
            maxWidth: `${availableWidth}px`,
            maxHeight: `${availableHeight}px`,
            zIndex: `${zIndex}`,
          });
        },
      }),
    ],
  });

  const dropdownContextValue = useMemo(
    () => ({
      setReference: refs.setReference,
      setFloating: refs.setFloating,
      floatingStyles,
    }),
    [refs, floatingStyles],
  );

  return (
    <dropdownContext.Provider value={dropdownContextValue}>
      <Menu {...otherProps} />
    </dropdownContext.Provider>
  );
};
