import { memo, useCallback } from "react";
import { Menu } from "@headlessui/react";
import cn from "classnames";
import { Icon } from "@/components/Icon";
import AnimateHeight from "react-animate-height";

const Item = memo(function Item(props: {
  className?: string;
  selected?: boolean;
  value: number | null;
  onClick?: () => void;
}) {
  return (
    <Menu.Item>
      <div
        className={cn(
          props.className,
          "grow flex items-center h-7 px-2 gap-2 leading-4 cursor-pointer rounded-md",
          {
            "hover:bg-f3f4f5": !props.selected,
          }
        )}
        onClick={props.onClick}
      >
        <Icon
          name="verified"
          className={cn("h-4 w-4", { "text-primary": props.selected })}
        />
        {props.value === 1
          ? "Unique"
          : props.value === 2
          ? "2 verifications"
          : props.value === 3
          ? "3 verifications"
          : props.value == null
          ? "Unlimited"
          : "Custom"}
      </div>
    </Menu.Item>
  );
});

export const VerificationSelect = memo(function VerificationSelect(props: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { onChange } = props;

  const handleSelect = useCallback(
    (value: number) => () => {
      onChange(value);
    },
    [onChange]
  );

  return (
    <Menu
      as="div"
      className="relative w-[166px] h-8"
      onClick={(event) => event.stopPropagation()}
    >
      {({ open }) => (
        <div
          className={cn(
            "absolute top-0 left-0 right-0 min-h-8 bg-ffffff border rounded-lg transition-all duration-300",
            {
              "border-ebecef z-10": !open,
              "border-transparent shadow-lg z-20": open,
            }
          )}
        >
          <Menu.Button
            className={cn("flex w-full h-8 items-center px-1 gap-2 text-left")}
          >
            <Item value={props.value} selected />
            <Icon
              name="angle-down"
              className={cn("h-4 w-4 transition-transform", {
                "rotate-180": open,
              })}
            />
          </Menu.Button>

          <AnimateHeight duration={300} height={open ? "auto" : 0}>
            <Menu.Items className="relative" static>
              <div className="grid gap-y-1 px-1 py-1">
                {props.value !== 2 && (
                  <Item
                    value={2}
                    className="text-neutral-secondary"
                    onClick={handleSelect(2)}
                  />
                )}
                {props.value !== 3 && (
                  <Item
                    value={3}
                    className="text-neutral-secondary"
                    onClick={handleSelect(2)}
                  />
                )}
                {props.value !== 0 && (
                  <Item
                    value={0}
                    className="text-neutral-secondary"
                    onClick={handleSelect(2)}
                  />
                )}
              </div>
              <div className="px-[5px]">
                <div className="relative">
                  <input
                    className="w-full h-[30px] pl-[30px] pr-1 bg-f9fafb border border-ebecef rounded-[6px] placeholder:text-neutral-secondary"
                    type="number"
                    min={4}
                    placeholder="Custom"
                  />
                  <Icon
                    name="verified"
                    className="h-4 w-4 absolute top-[7px] left-[7px] text-neutral-secondary"
                  />
                </div>
              </div>
              <div className="mx-3 mt-3 pt-2 pb-3 text-12 text-left border-t border-657080/5">
                Changing this will not retroactively affect already verified
                users!
              </div>
            </Menu.Items>
          </AnimateHeight>
        </div>
      )}
    </Menu>
  );
});
