import { memo, ReactNode, useMemo, useRef } from "react";
import cn from "classnames";
import { Icon } from "src/common/Icon";
import { useToggle } from "src/hooks/useToggle";
import { useClickOutside } from "src/hooks/useClickOutside";
import { useEffect } from "react";

export const Dropdown = memo(function Dropdown(props: {
  buttonClassName?: string;
  className?: string;
  containerClassName?: string;
  children?: ReactNode;
  toggler?: ReturnType<typeof useToggle>;
}) {
  const containerReference = useRef<HTMLDivElement>(null);
  const buttonReference = useRef<HTMLButtonElement>(null);
  const dropdownReference = useRef<HTMLDivElement>(null);
  const toggler = useToggle();

  const { isOn, toggleOff, toggle } = useMemo(() => {
    if (!props.toggler) {
      return toggler;
    }

    return props.toggler;
  }, [props.toggler, toggler]);

  useClickOutside({
    target: containerReference,
    onClickOutside: toggleOff,
  });

  // for fix overflow bug we manually set bounds for dropdown with fixed position
  useEffect(() => {
    if (!isOn || !buttonReference.current || !dropdownReference.current) return;
    const Button = buttonReference.current;
    const Dropdown = dropdownReference.current;
    const buttonBounds = Button.getBoundingClientRect();
    Dropdown.style.top = `${buttonBounds.top}px`;
    Dropdown.style.left = `${buttonBounds.left + buttonBounds.width}px`;
  }, [isOn]);

  return (
    <div className={cn("relative", props.className)} ref={containerReference}>
      <button
        className={cn("grid items-center", props.buttonClassName)}
        onClick={toggle}
        ref={buttonReference}
      >
        <Icon className="w-6 h-6 text-neutral" name="dots" />
      </button>

      <div
        className={cn(
          "fixed transition-all overflow-hidden duration-500 origin-top-right -translate-x-full",
          { "max-w-0 max-h-0": !isOn },
          { "max-w-[500px] max-h-[500px]": isOn },
          props.containerClassName
        )}
        ref={dropdownReference}
      >
        {props.children}
      </div>
    </div>
  );
});
