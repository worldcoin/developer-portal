import { Icon, IconType } from "common/Icon";
import { Dispatch, memo, SetStateAction, useCallback } from "react";
import cn from "classnames";
import { styles } from "common/styles";
import { UserInterfacesType } from "types";

export const InterfaceButton = memo(function InterfaceButton(props: {
  icon: IconType;
  title: string;
  description: string;
  value: UserInterfacesType;
  selected?: boolean;
  className?: string;
  changeSection: Dispatch<SetStateAction<UserInterfacesType>>;
  enabled?: boolean;
  disabled?: boolean;
}) {
  const changeSection = useCallback(
    () => props.changeSection(props.value),
    [props]
  );
  return (
    <button
      value={props.value}
      className={cn(
        "p-6 select-none flex flex-col items-center border relative disabled:bg-d1d3d4/30 disabled:text-neutral group",
        props.className,
        props.selected ? styles.container.flat : styles.container.shadowBox,
        { "!border-primary bg-neutral-muted/40 text-primary": props.selected },
        { "border-primary/0": !props.selected },
        { "cursor-not-allowed": props.disabled }
      )}
      onClick={changeSection}
      disabled={props.disabled}
    >
      {props.disabled && (
        <div
          className={cn(
            styles.container.shadowBox,
            "bg-ffffff absolute top-0 opacity-0 invisible z-50 left-0 right-0 text-000000 p-2 text-14",
            "transition-all group-hover:-top-1/3 group-hover:opacity-100 group-hover:visible"
          )}
        >
          This user interface is not available for on-chain actions
        </div>
      )}

      {!props.disabled && props.enabled && (
        <div
          className={cn(
            "absolute top-3 right-3 px-4 py-1.5 border rounded-full text-12 leading-[1.2] text-success ",
            "border-success bg-success/[.05] "
          )}
        >
          Enabled
        </div>
      )}

      <div
        className={cn(
          "text-0 w-12 h-12 border rounded-full flex items-center justify-center",
          {
            "border-neutral-muted": !props.selected,
            "border-neutral": props.disabled,
          }
        )}
      >
        <Icon
          name={props.icon}
          className={cn("w-6 h-6", {
            "text-primary": !props.disabled,
            "text-neutral": props.disabled,
          })}
        />
      </div>

      <span className="mt-3 font-semibold font-sora text-20">
        {props.title}
      </span>
      <p className="text-14 mt-1.5">{props.description}</p>
    </button>
  );
});
