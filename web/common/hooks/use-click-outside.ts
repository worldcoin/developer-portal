import { useEffect, RefObject } from "react";

export const useClickOutside = <T extends HTMLElement>(props: {
  target: RefObject<T>;
  onClickOutside: () => void;
}): void => {
  useEffect(() => {
    if (!props.target.current) {
      return;
    }

    const handleClickOutside: EventListener = (e) => {
      if (!e.target || props.target.current?.contains(e.target as Node)) {
        return;
      }

      props.onClickOutside();
    };

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  });
};
