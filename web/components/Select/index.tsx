import { autoUpdate, flip, size, useFloating } from "@floating-ui/react";
import { Listbox, ListboxProps } from "@headlessui/react";
import { CSSProperties, createContext, useMemo } from "react";

export * from "./Button";
export * from "./Option";
export * from "./Options";

type selectContextValue = {
  setReference: (element: HTMLElement | null) => void;
  setFloating: (element: HTMLElement | null) => void;
  floatingStyles: CSSProperties;
};

export const selectContext = createContext({} as selectContextValue);

type SelectProps<T> = ListboxProps<"div", T, any> & {
  placement?: "bottom-start" | "top-start";
};

export const Select = <T,>(props: SelectProps<T>) => {
  const { placement = "bottom-start", ...listboxProps } = props;

  const { refs, floatingStyles } = useFloating({
    placement,
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      flip({
        fallbackPlacements:
          placement === "top-start"
            ? ["bottom-start", "top-start"]
            : ["top-start", "bottom-start"],
      }),
      size({
        apply({ availableWidth, availableHeight, elements, rects }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
            maxWidth: `${availableWidth}px`,
            maxHeight: `${availableHeight}px`,
          });
        },
      }),
    ],
  });

  const selectContextValue = useMemo(
    () => ({
      setReference: refs.setReference,
      setFloating: refs.setFloating,
      floatingStyles,
    }),
    [refs, floatingStyles],
  );

  return (
    <selectContext.Provider value={selectContextValue}>
      <Listbox {...listboxProps} />
    </selectContext.Provider>
  );
};
