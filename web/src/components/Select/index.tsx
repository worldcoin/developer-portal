import { memo, useCallback, useEffect, useState } from "react";
import cn from "classnames";
import { useToggle } from "src/hooks/useToggle";
import { Icon } from "src/components/Icon";
import { SelectItem } from "src/components/types/select-item";

export const Select = memo(function Select(props: {
  className?: string;
  items?: Array<SelectItem>;
  itemClassName?: string;
  changeValue: (value: string) => void;
  notSelectedText: string;
  notAvailableStamp?: string;
  value?: string;
}) {
  const select = useToggle();

  const [value, setValue] = useState<string | null>(
    props.value ? props.value : null
  );

  const onClick = useCallback(
    (value: string) => () => {
      setValue((prevValue) => {
        if (prevValue !== value) {
          props.changeValue(value);
          return value;
        }

        return prevValue;
      });
    },
    [props]
  );

  useEffect(() => {
    if (!props.value) {
      return;
    }

    setValue(props.value);
  }, [props.value]);

  return (
    <ul
      className={cn(
        props.className,
        { "max-h-[64px] cursor-pointer": !select.isOn },
        { "max-h-[1000px]": select.isOn },
        "absolute inset-x-0 top-0 overflow-hidden select-none transition-all"
      )}
      onClick={select.toggle}
    >
      {!value && <li className="p-5 text-neutral">{props.notSelectedText}</li>}
      {props.items?.map((item, index) => (
        <li
          key={`environment-${index}`}
          value={item.value}
          className={cn(
            "p-5 grid grid-cols-auto/1fr/auto items-center gap-x-3",
            {
              "hover:bg-neutral-muted": value !== item.value,
            },
            {
              "select-none cursor-not-allowed": item.disabled,
            },
            {
              "cursor-pointer": !item.disabled,
            }
          )}
          onClick={item.disabled ? () => {} : onClick(item.value)}
        >
          <Icon
            name={item.icon.name}
            className={cn("w-6 h-6 text-primary", {
              "opacity-30": item.disabled,
            })}
            noMask={item.icon.noMask}
          />
          <span className={cn({ "opacity-30": item.disabled })}>
            {item.name}
          </span>

          {item.disabled && props.notAvailableStamp && (
            <span className="border px-4 py-2 text-primary leading-none text-14 border-primary rounded-full bg-neutral-muted/40">
              {props.notAvailableStamp}
            </span>
          )}
        </li>
      ))}
      <Icon name="angle-down" className="w-6 h-6 absolute top-5 right-5" />
    </ul>
  );
});
