import { Listbox, ListboxProps } from "@headlessui/react";
import { useFloating, autoUpdate, size } from "@floating-ui/react";
import { createContext, CSSProperties, useMemo } from "react";

export * from "./Button";
export * from "./Option";
export * from "./Options";

type selectContextValue = {
  setReference: (element: HTMLElement | null) => void;
  setFloating: (element: HTMLElement | null) => void;
  floatingStyles: CSSProperties;
};

export const selectContext = createContext({} as selectContextValue);

type SelectProps<T> = ListboxProps<"div", T, any>;

export const Select = <T,>(props: SelectProps<T>) => {
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
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
      <Listbox {...props} />
    </selectContext.Provider>
  );
};
