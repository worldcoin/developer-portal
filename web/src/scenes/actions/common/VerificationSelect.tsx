import { memo, useCallback, useState } from "react";
import { Menu } from "@headlessui/react";
import cn from "classnames";
import { Icon } from "@/components/Icon";
import AnimateHeight from "react-animate-height";

const Item = memo(function Item(props: {
  className?: string;
  size?: "lg";
  selected?: boolean;
  value: number | null;
  onClick?: () => void;
}) {
  return (
    <Menu.Item>
      <div
        className={cn(
          props.className,
          "grow flex items-center gap-2 leading-4 cursor-pointer rounded-md whitespace-nowrap",
          {
            "h-7 px-2": props.size == null,
            "h-8 px-3": props.size === "lg",
            "hover:bg-f3f4f5": !props.selected,
          }
        )}
        onClick={props.onClick}
      >
        <Icon
          name="verified"
          className={cn({
            "h-4 w-4": props.size == null,
            "h-6 w-6": props.size === "lg",
            "text-primary": props.selected,
          })}
        />
        <span className="text-14">
          {props.value === 1 && "Unique"}
          {props.value === 2 && "2 verifications"}
          {props.value === 3 && "3 verifications"}
          {props.value == 0 && "Unlimited"}
          {![0, 1, 2, 3].some((item) => item === props.value) &&
            `${props.value} verifications`}
        </span>
      </div>
    </Menu.Item>
  );
});

export const VerificationSelect = memo(function VerificationSelect(props: {
  size?: "lg";
  fullWidth?: boolean;
  dropUp?: boolean;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [input, setInput] = useState("");
  const { onChange } = props;

  const handleSelect = useCallback(
    (value: number) => () => {
      onChange(value);
    },
    [onChange]
  );

  const submitInput = useCallback(() => {
    handleSelect(Number(input))();
    setInput("");
  }, [handleSelect, input]);

  return (
    <Menu
      as="div"
      className={cn("relative", {
        "h-8": props.size == null,
        "h-12": props.size === "lg",
        "min-w-[188px]": !props.fullWidth,
        "w-full": props.fullWidth,
      })}
      onClick={(event) => event.stopPropagation()}
    >
      {({ open }) => (
        <div
          className={cn(
            "absolute left-0 right-0 flex flex-col border rounded-lg transition-all duration-300",
            {
              "top-0": !props.dropUp,
              "bottom-0": props.dropUp,
              "z-10": !open,
              "bg-ffffff border-ebecef": !open && props.size == null,
              "bg-f3f4f5 border-transparent": !open && props.size === "lg",
              "bg-ffffff border-transparent shadow-lg z-20": open,
            }
          )}
        >
          <Menu.Button
            className={cn("flex w-full items-center gap-2 text-left", {
              "h-8 px-1": props.size == null,
              "h-12 pl-1 pr-3": props.size === "lg",
              "order-2": props.dropUp,
            })}
          >
            <Item size={props.size} value={props.value} selected />
            <Icon
              name="angle-down"
              className={cn("shrink-0 transition-transform", {
                "h-4 w-4": props.size == null,
                "h-6 w-6": props.size === "lg",
                "rotate-180": open,
              })}
            />
          </Menu.Button>

          <AnimateHeight duration={300} height={open ? "auto" : 0}>
            <Menu.Items
              className={cn("relative flex flex-col", {
                "flex-col": !props.dropUp,
                "flex-col-reverse pt-1": props.dropUp,
              })}
              static
            >
              <div
                className={cn("flex gap-y-1 px-1 py-1", {
                  "flex-col": !props.dropUp,
                  "flex-col-reverse": props.dropUp,
                })}
              >
                {props.value !== 1 && (
                  <Item
                    size={props.size}
                    value={1}
                    className="text-neutral-secondary"
                    onClick={handleSelect(1)}
                  />
                )}
                {props.value !== 2 && (
                  <Item
                    size={props.size}
                    value={2}
                    className="text-neutral-secondary"
                    onClick={handleSelect(2)}
                  />
                )}
                {props.value !== 3 && (
                  <Item
                    size={props.size}
                    value={3}
                    className="text-neutral-secondary"
                    onClick={handleSelect(3)}
                  />
                )}
                {props.value !== 0 && (
                  <Item
                    size={props.size}
                    value={0}
                    className="text-neutral-secondary"
                    onClick={handleSelect(0)}
                  />
                )}
              </div>
              <div className="px-[5px]">
                <div className="relative">
                  <input
                    className={cn(
                      "w-full text-14 pr-1 bg-f9fafb border border-ebecef rounded-[6px] placeholder:text-neutral-secondary",
                      {
                        "h-[30px] pl-[30px]": props.size == null,
                        "h-[32px] pl-[42px]": props.size === "lg",
                      }
                    )}
                    type="number"
                    value={input}
                    min={4}
                    placeholder="Custom"
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(event) =>
                      event.key === "Enter" && submitInput()
                    }
                  />
                  <Icon
                    name="verified"
                    className={cn("absolute text-neutral-secondary", {
                      "top-[7px] left-[7px] h-4 w-4": props.size == null,
                      "top-[4px] left-[11px] h-6 w-6": props.size === "lg",
                    })}
                  />
                </div>
              </div>
              {props.hint && (
                <div className="mx-3 mt-3 pt-2 pb-2 text-12 text-left border-t border-657080/5">
                  {props.hint}
                </div>
              )}
            </Menu.Items>
          </AnimateHeight>
        </div>
      )}
    </Menu>
  );
});
